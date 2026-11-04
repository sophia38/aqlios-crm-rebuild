import dayjs from 'dayjs';
import { http } from 'msw/http';
import { CRM_API } from '@/lib/api/config';
import { TEMPLATE_NAME_MAX } from '@/lib/api/rota';
import type {
  AssignmentInput,
  AssignmentUpdate,
  PublishSlotInput,
  RotaTemplate,
  RotaTemplateInput,
  ShiftSlot,
  SlotBid,
} from '@/lib/api/types';
import { mockId } from '../fixtures/random';
import {
  assignableRotaStaff,
  bidsFor,
  dayKeyOf,
  findShift,
  isBankHoliday,
  mondayOf,
  openSlots,
  rota,
  scopeRange,
  weekWithChanges,
  type AssignmentRecord,
} from '../rotaState';
import { currentPersona, getDb, saveDb } from '../store';
import { created, fail, forbidden, ok } from '../respond';
import { guardPractice } from './rota';

// Practice ROTA mocks (docs/plans/phase-5-practice-modules.md §5): assignments, published slots and
// bidding, and rota templates. All inferred.

const path = (rest: string) => `*${CRM_API}/rota/v1/sub-apps/:subAppId/${rest}`;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const MAX_TEMPLATE_DAYS = 28;
const today = () => dayjs().format('YYYY-MM-DD');

/** Slots must be valid times, end after start, and not overlap each other. */
function slotProblem(slots: ShiftSlot[] | undefined) {
  if (!slots?.length) return 'Add at least one shift slot';
  for (const slot of slots) {
    if (!TIME.test(slot.start_time) || !TIME.test(slot.end_time)) return 'Enter valid times (HH:mm)';
    if (slot.end_time <= slot.start_time) return 'The end time must be after the start time';
  }
  const sorted = [...slots].sort((a, b) => a.start_time.localeCompare(b.start_time));
  if (sorted.some((slot, index) => index > 0 && slot.start_time < sorted[index - 1].end_time)) {
    return 'Shift slots must not overlap';
  }
  return null;
}

function breakProblem(start?: string, end?: string, slots: ShiftSlot[] = []) {
  if (!start && !end) return null;
  if (!start || !end || !TIME.test(start) || !TIME.test(end) || end <= start)
    return 'Enter a valid break (HH:mm to HH:mm)';
  if (!slots.some((slot) => start >= slot.start_time && end <= slot.end_time))
    return 'The break must be inside a shift slot';
  return null;
}

function assignmentProblem(input: Partial<AssignmentInput>) {
  if (!input.practice_id) return 'Practice is required';
  const staff = assignableRotaStaff(input.practice_id, input.start_date ?? today()).find(
    (item) => item.id === input.staff_id,
  );
  if (!staff) return 'Select a staff member';
  if (!input.start_date || !dayjs(input.start_date).isValid()) return 'Start Date is required';
  if (input.start_date < today()) return "Shifts can't be assigned in the past";
  if (input.type === 'RECURRING') {
    if (!input.end_date || input.end_date < input.start_date) return 'End Date must be on or after the Start Date';
    if (!input.days?.length) return 'Choose at least one day to repeat on';
  } else if (input.type !== 'ONCE') return 'Assignment Type is required';
  return (
    slotProblem(input.slots) ??
    (!input.duty_type ? 'Duty Type is required' : null) ??
    (!input.appointment_types?.length ? 'Appointment Type is required' : null) ??
    (!input.urgencies?.length ? 'Routine / Urgent is required' : null) ??
    breakProblem(input.break_start, input.break_end, input.slots)
  );
}

function templateProblem(input: Partial<RotaTemplateInput>, practiceTemplates: RotaTemplate[], excludeId?: string) {
  const name = String(input.name ?? '').trim();
  if (!name) return 'Template Name is required';
  if (name.length > TEMPLATE_NAME_MAX) return `Template Name must be ${TEMPLATE_NAME_MAX} characters or fewer`;
  if (practiceTemplates.some((item) => item.id !== excludeId && item.name.toLowerCase() === name.toLowerCase())) {
    return 'A template with this name already exists for this practice';
  }
  return null;
}

const personaBid = (): SlotBid => {
  const persona = currentPersona();
  return {
    id: mockId('bid', Date.now()),
    staff_id: persona.userId,
    staff_name: `${persona.firstName} ${persona.lastName}`,
    role_name: persona.isAdmin ? 'Practice Manager' : 'Clinician',
    created_at: new Date().toISOString(),
  };
};

function findSlot(slotId: string) {
  const date = slotId.match(/(\d{4}-\d{2}-\d{2})$/)?.[1];
  if (!date) return null;
  return weekWithChanges(mondayOf(date)).gaps.find((gap) => gap.id === slotId && gap.kind === 'published') ?? null;
}

export const rotaPracticeHandlers = [
  // ---- assignments
  http.post(path('assignments'), async ({ request }) => {
    const input = (await request.json()) as Partial<AssignmentInput>;
    const denied = guardPractice(input.practice_id ?? null);
    if (denied) return denied;
    const problem = assignmentProblem(input);
    if (problem) return fail(400, problem);
    const staff = assignableRotaStaff(input.practice_id!, input.start_date!).find(
      (item) => item.id === input.staff_id,
    )!;
    const record: AssignmentRecord = {
      id: mockId('assignment', Date.now() + rota().assignments.length),
      staff_id: staff.id,
      staff_name: staff.name,
      role_name: staff.role_name,
      staff_type: staff.staff_type,
      practice_id: input.practice_id!,
      type: input.type!,
      start_date: input.start_date!,
      end_date: input.type === 'RECURRING' ? input.end_date! : null,
      days: input.type === 'RECURRING' ? input.days! : [dayKeyOf(input.start_date!)],
      slots: input.slots!,
      duty_type: input.duty_type!,
      appointment_types: input.appointment_types!,
      urgencies: input.urgencies!,
      break_start: input.break_start ?? '',
      break_end: input.break_end ?? '',
    };
    rota().assignments.push(record);
    saveDb();
    return created(
      weekWithChanges(mondayOf(record.start_date)).shifts.filter((shift) => shift.series_id?.startsWith(record.id)),
      'Staff assigned successfully',
    );
  }),

  http.patch(path('assignments/:shiftId'), async ({ request, params }) => {
    const shift = findShift(String(params.shiftId));
    if (!shift) return fail(404, 'Shift not found');
    const denied = guardPractice(shift.practice_id);
    if (denied) return denied;
    if (shift.date < today()) return fail(400, "Past shifts can't be changed");
    const input = (await request.json()) as Partial<AssignmentUpdate>;
    const slots = [{ start_time: input.start_time ?? '', end_time: input.end_time ?? '' }];
    const problem =
      slotProblem(slots) ??
      (!input.duty_type ? 'Duty Type is required' : null) ??
      (!input.appointment_types?.length ? 'Appointment Type is required' : null) ??
      (!input.urgencies?.length ? 'Routine / Urgent is required' : null) ??
      breakProblem(input.break_start, input.break_end, slots);
    if (problem) return fail(400, problem);
    const scope = new URL(request.url).searchParams.get('scope') ?? 'CURRENT';
    rota().overrides.push({
      series_id: shift.series_id!,
      ...scopeRange(shift, scope),
      patch: {
        start_time: input.start_time,
        end_time: input.end_time,
        duty_type: input.duty_type,
        appointment_types: input.appointment_types,
        urgencies: input.urgencies,
        break_start: input.break_start ?? '',
        break_end: input.break_end ?? '',
      },
    });
    saveDb();
    return ok(findShift(shift.id), 'Assignment updated successfully');
  }),

  http.delete(path('assignments/:shiftId'), ({ request, params }) => {
    const shift = findShift(String(params.shiftId));
    if (!shift) return fail(404, 'Shift not found');
    const denied = guardPractice(shift.practice_id);
    if (denied) return denied;
    if (shift.date < today()) return fail(400, "Past shifts can't be deleted");
    const scope = new URL(request.url).searchParams.get('scope') ?? 'CURRENT';
    rota().overrides.push({ series_id: shift.series_id!, ...scopeRange(shift, scope), deleted: true });
    saveDb();
    return ok({ id: shift.id }, 'Assignment deleted successfully');
  }),

  // ---- published slots and bidding
  http.get(path('published-slots'), ({ request }) => {
    const practiceId = new URL(request.url).searchParams.get('practice_id');
    const denied = guardPractice(practiceId);
    if (denied) return denied;
    if (!practiceId) return fail(400, 'Practice is required');
    return ok(openSlots(practiceId));
  }),

  http.post(path('published-slots'), async ({ request }) => {
    const input = (await request.json()) as Partial<PublishSlotInput>;
    const denied = guardPractice(input.practice_id ?? null);
    if (denied) return denied;
    if (!currentPersona().isAdmin) return forbidden();
    const problem =
      (!input.date || input.date < today() ? 'Choose today or a later date' : null) ??
      slotProblem([{ start_time: input.start_time ?? '', end_time: input.end_time ?? '' }]) ??
      (!input.duty_type ? 'Duty Type is required' : null) ??
      (!input.rate_per_hour || input.rate_per_hour <= 0 ? 'Enter the rate per hour' : null) ??
      (!input.bidding_closes || input.bidding_closes > input.date! || input.bidding_closes < today()
        ? 'Bidding must close between today and the slot date'
        : null) ??
      (input.repeat_weekly && (!input.repeat_until || input.repeat_until <= input.date!)
        ? 'Repeat Until must be after the slot date'
        : null);
    if (problem) return fail(400, problem);
    const record = {
      id: mockId('published', Date.now()),
      practice_id: input.practice_id!,
      start_date: input.date!,
      repeat_until: input.repeat_weekly ? input.repeat_until! : null,
      start_time: input.start_time!,
      end_time: input.end_time!,
      duty_type: input.duty_type!,
      rate_per_hour: input.rate_per_hour!,
      closes_days_before: dayjs(input.date).diff(dayjs(input.bidding_closes), 'day'),
    };
    rota().published.push(record);
    saveDb();
    return created(
      openSlots(record.practice_id).filter((slot) => slot.id.startsWith(`pub-${record.id}-`)),
      'Slot published successfully',
    );
  }),

  http.post(path('published-slots/:slotId/claim'), ({ params }) => {
    const slotId = String(params.slotId);
    const slot = findSlot(slotId);
    if (!slot || rota().filled[slotId]) return fail(404, 'This slot is no longer open');
    const denied = guardPractice(slot.practice_id);
    if (denied) return denied;
    const me = currentPersona().userId;
    if (bidsFor(slotId, slot.practice_id).some((bid) => bid.staff_id === me))
      return fail(400, "You've already claimed this slot");
    (rota().bids[slotId] ??= []).push(personaBid());
    rota().declines[slotId] = (rota().declines[slotId] ?? []).filter((id) => id !== me);
    saveDb();
    return ok(
      openSlots(slot.practice_id!).find((item) => item.id === slotId),
      'Slot claimed successfully',
    );
  }),

  http.post(path('published-slots/:slotId/decline'), ({ params }) => {
    const slotId = String(params.slotId);
    const slot = findSlot(slotId);
    if (!slot || rota().filled[slotId]) return fail(404, 'This slot is no longer open');
    const denied = guardPractice(slot.practice_id);
    if (denied) return denied;
    const me = currentPersona().userId;
    rota().bids[slotId] = (rota().bids[slotId] ?? []).filter((bid) => bid.staff_id !== me);
    rota().declines[slotId] = [...new Set([...(rota().declines[slotId] ?? []), me])];
    saveDb();
    return ok(
      openSlots(slot.practice_id!).find((item) => item.id === slotId),
      'Slot declined',
    );
  }),

  http.post(path('published-slots/:slotId/bids/:bidId/accept'), ({ params }) => {
    const slotId = String(params.slotId);
    const slot = findSlot(slotId);
    if (!slot || rota().filled[slotId]) return fail(404, 'This slot is no longer open');
    const denied = guardPractice(slot.practice_id);
    if (denied) return denied;
    if (!currentPersona().isAdmin) return forbidden();
    const bid = bidsFor(slotId, slot.practice_id).find((item) => item.id === params.bidId);
    if (!bid) return fail(404, 'Bid not found');
    const details = openSlots(slot.practice_id!).find((item) => item.id === slotId);
    const record: AssignmentRecord = {
      id: mockId('assignment-bid', Date.now()),
      staff_id: bid.staff_id,
      staff_name: bid.staff_name,
      role_name: bid.role_name,
      staff_type: 'LOCUM',
      practice_id: slot.practice_id!,
      type: 'ONCE',
      start_date: slot.date,
      end_date: null,
      days: [dayKeyOf(slot.date)],
      slots: [{ start_time: slot.start_time, end_time: slot.end_time }],
      duty_type: details?.duty_type ?? 'PM_SESSION',
      appointment_types: ['FACE_TO_FACE_SURGERY'],
      urgencies: ['ROUTINE', 'URGENT'],
      break_start: '',
      break_end: '',
    };
    rota().assignments.push(record);
    rota().filled[slotId] = bid.staff_id;
    saveDb();
    return ok(findShift(`asg-${record.id}-0-${slot.date}`), 'Bid accepted successfully');
  }),

  // ---- rota templates
  http.get(path('rota-templates'), ({ request }) => {
    const practiceId = new URL(request.url).searchParams.get('practice_id');
    const denied = guardPractice(practiceId);
    if (denied) return denied;
    // Fix: only this practice's templates (live lists other practices' templates too).
    return ok(rota().templates.filter((item) => !practiceId || item.practice_id === practiceId));
  }),

  http.post(path('rota-templates'), async ({ request }) => {
    const input = (await request.json()) as Partial<RotaTemplateInput>;
    const denied = guardPractice(input.practice_id ?? null);
    if (denied) return denied;
    const practiceId = input.practice_id!;
    const problem =
      templateProblem(
        input,
        rota().templates.filter((item) => item.practice_id === practiceId),
      ) ??
      (!input.staff_ids?.length ? 'Select at least one staff member' : null) ??
      (!input.start_date || !input.end_date || input.end_date < input.start_date
        ? 'End Date must be on or after the Start Date'
        : null) ??
      (dayjs(input.end_date).diff(dayjs(input.start_date), 'day') >= MAX_TEMPLATE_DAYS
        ? `Choose up to ${MAX_TEMPLATE_DAYS / 7} weeks`
        : null);
    if (problem) return fail(400, problem);
    const days = dayjs(input.end_date).diff(dayjs(input.start_date), 'day') + 1;
    const weeks = [
      ...new Set(
        Array.from({ length: days }, (_, offset) =>
          mondayOf(dayjs(input.start_date).add(offset, 'day').format('YYYY-MM-DD')),
        ),
      ),
    ];
    const shifts = weeks
      .flatMap((week) => weekWithChanges(week).shifts)
      .filter(
        (shift) =>
          shift.practice_id === practiceId &&
          input.staff_ids!.includes(shift.staff_id) &&
          shift.date >= input.start_date! &&
          shift.date <= input.end_date! &&
          (input.include_bank_holidays || !isBankHoliday(shift.date)),
      )
      .map((shift) => ({
        staff_id: shift.staff_id,
        staff_name: shift.staff_name,
        day_offset: dayjs(shift.date).diff(dayjs(input.start_date), 'day'),
        start_time: shift.start_time,
        end_time: shift.end_time,
        duty_type: shift.duty_type,
      }));
    if (!shifts.length) return fail(400, 'There are no shifts for these staff in this date range');
    const template: RotaTemplate = {
      id: mockId('rota-template', Date.now()),
      name: input.name!.trim(),
      practice_id: practiceId,
      practice_name: getDb().practices.find((practice) => practice.id === practiceId)?.practice_name ?? '',
      rota_group_id: input.rota_group_id ?? null,
      staff_ids: input.staff_ids!,
      start_date: input.start_date!,
      end_date: input.end_date!,
      include_bank_holidays: Boolean(input.include_bank_holidays),
      shifts,
      created_at: new Date().toISOString(),
    };
    rota().templates.push(template);
    saveDb();
    return created(template, 'Template created successfully');
  }),

  http.patch(path('rota-templates/:templateId'), async ({ request, params }) => {
    const template = rota().templates.find((item) => item.id === params.templateId);
    if (!template) return fail(404, 'Template not found');
    const denied = guardPractice(template.practice_id);
    if (denied) return denied;
    const { name } = (await request.json()) as { name?: string };
    const problem = templateProblem(
      { name },
      rota().templates.filter((item) => item.practice_id === template.practice_id),
      template.id,
    );
    if (problem) return fail(400, problem);
    template.name = name!.trim();
    saveDb();
    return ok(template, 'Template updated successfully');
  }),

  http.delete(path('rota-templates/:templateId'), ({ params }) => {
    const template = rota().templates.find((item) => item.id === params.templateId);
    if (!template) return fail(404, 'Template not found');
    const denied = guardPractice(template.practice_id);
    if (denied) return denied;
    rota().templates = rota().templates.filter((item) => item.id !== template.id);
    saveDb();
    return ok({ id: template.id }, 'Template deleted successfully');
  }),

  http.post(path('rota-templates/:templateId/apply'), async ({ request, params }) => {
    const template = rota().templates.find((item) => item.id === params.templateId);
    if (!template) return fail(404, 'Template not found');
    const denied = guardPractice(template.practice_id);
    if (denied) return denied;
    const { start_date: start, clear_existing: clear } = (await request.json()) as {
      start_date?: string;
      clear_existing?: boolean;
    };
    if (!start || start < today()) return fail(400, 'Choose today or a later start date');
    const length = dayjs(template.end_date).diff(dayjs(template.start_date), 'day');
    const end = dayjs(start).add(length, 'day').format('YYYY-MM-DD');
    const state = rota();
    if (clear) {
      // Clear these staff's existing shifts at this practice in the range first.
      const weeks = [
        ...new Set(
          Array.from({ length: length + 1 }, (_, offset) =>
            mondayOf(dayjs(start).add(offset, 'day').format('YYYY-MM-DD')),
          ),
        ),
      ];
      const series = new Set(
        weeks
          .flatMap((week) => weekWithChanges(week).shifts)
          .filter((shift) => shift.practice_id === template.practice_id && template.staff_ids.includes(shift.staff_id))
          .map((shift) => shift.series_id!),
      );
      for (const id of series) state.overrides.push({ series_id: id, from: start, to: end, deleted: true });
    }
    const staff = assignableRotaStaff(template.practice_id, start);
    let createdCount = 0;
    for (const shift of template.shifts) {
      const date = dayjs(start).add(shift.day_offset, 'day').format('YYYY-MM-DD');
      if (!template.include_bank_holidays && isBankHoliday(date)) continue;
      const person = staff.find((item) => item.id === shift.staff_id);
      state.assignments.push({
        id: mockId('assignment-template', Date.now() + createdCount),
        staff_id: shift.staff_id,
        staff_name: shift.staff_name,
        role_name: person?.role_name ?? '',
        staff_type: person?.staff_type ?? 'SALARIED',
        practice_id: template.practice_id,
        type: 'ONCE',
        start_date: date,
        end_date: null,
        days: [dayKeyOf(date)],
        slots: [{ start_time: shift.start_time, end_time: shift.end_time }],
        duty_type: shift.duty_type,
        appointment_types: ['FACE_TO_FACE_SURGERY'],
        urgencies: ['ROUTINE', 'URGENT'],
        break_start: '',
        break_end: '',
      });
      createdCount += 1;
    }
    saveDb();
    return ok({ created: createdCount }, 'Template applied successfully');
  }),
];
