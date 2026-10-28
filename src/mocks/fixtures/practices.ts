import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import type { OperatingHours, Practice } from '@/lib/api/types';
import { buildPracticeManagers, buildRotaGroups } from './lookups';
import { createRandom, isoDaysAgo, mockId } from './random';

// Fictional practices. Place names are generic English towns and streets; no data is copied from the dev app.
const PLACES = [
  'Ashford',
  'Barnwell',
  'Brookfield',
  'Castleton',
  'Cedar Lane',
  'Chapel Street',
  'Clifton',
  'Coleridge',
  'Elmwood',
  'Fairfield',
  'Fenton',
  'Greenhill',
  'Hartley',
  'Hawthorn',
  'Highgate',
  'Holloway',
  'Kingsway',
  'Langley',
  'Linden',
  'Marsh Road',
  'Meadowbank',
  'Millbrook',
  'Northgate',
  'Oakridge',
  'Orchard',
  'Parkside',
  'Priory',
  'Queensway',
  'Riverside',
  'Rosehill',
  'Southfields',
  'Springwell',
  'Stanmore',
  'Stonebridge',
  'Thornbury',
  'Upton',
  'Victoria Road',
  'Westbrook',
  'Whitfield',
  'Willow Bank',
  'Woodside',
  'Yardley',
] as const;
const SUFFIXES = ['Medical Centre', 'Surgery', 'Medical Practice', 'Health Centre', 'Family Practice'] as const;
const CITIES = ['Leeds', 'Bradford', 'York', 'Sheffield', 'Manchester', 'Nottingham', 'Leicester', 'Coventry'] as const;
const PCNS = ['North Leeds PCN', 'Central PCN', 'Riverside PCN', 'Valley Health PCN', 'Eastside PCN'] as const;
const SUB_ICBS = ['NHS West Yorkshire ICB', 'NHS South Yorkshire ICB', 'NHS Greater Manchester ICB'] as const;
const DAYS: OperatingHours['day'][] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

export const PRACTICE_COUNT = 155;

/** The demo practices with rich data in later phases (practice user has the first two). */
export const DEMO_PRACTICE_INDEXES = [0, 1, 2];

function practiceNames(count: number) {
  const names: string[] = [];
  for (let i = 0; names.length < count; i++) {
    const place = PLACES[i % PLACES.length];
    const suffix = SUFFIXES[Math.floor(i / PLACES.length) % SUFFIXES.length];
    names.push(`${place} ${suffix}`);
  }
  return names;
}

function operatingHours(practiceId: string, createdAt: string, weekdaysOnly: boolean): OperatingHours[] {
  return DAYS.map((day, index) => {
    const open = index < 5 || (!weekdaysOnly && index === 5);
    return {
      id: mockId(`hours:${practiceId}`, index),
      practice: practiceId,
      day,
      opening_time: open ? '08:00' : null,
      closing_time: open ? (index === 5 ? '12:00' : '18:30') : null,
      practice_state: open ? 'OPEN' : 'CLOSED',
      subapp_id: null,
      created_at: createdAt,
      updated_at: createdAt,
      deleted_at: null,
    };
  });
}

/**
 * Practices whose profile was never finished. Their status is worked out from their configuration
 * (see `practiceStatus` in src/mocks/store.ts), so finishing the profile clears the orange row.
 */
export function isUnconfiguredFixture(index: number) {
  return index % 7 === 3 || index % 11 === 5;
}

export function buildPractices(): Practice[] {
  const random = createRandom(155);
  const managers = buildPracticeManagers();
  const rotaGroups = buildRotaGroups();
  return practiceNames(PRACTICE_COUNT).map((name, index) => {
    const id = mockId('practice', index);
    const createdAt = isoDaysAgo(index * 2 + random.int(0, 1), random.int(8, 17));
    // Some unfinished practices are also missing required details (empty PCN or phone).
    const incomplete = isUnconfiguredFixture(index) && random.bool(0.5);
    const manager = random.bool(0.75) ? random.pick(managers) : null;
    const emailUser = name
      .toLowerCase()
      .replace(/[^a-z]+/g, '.')
      .replace(/\.$/, '');
    return {
      id,
      auth31_id: mockId('auth31-practice', index),
      subapp: PUBLIC_SUB_APP_ID,
      practice_name: name,
      practice_type: 'PUBLIC',
      ods_code: `Y${String(10000 + index * 37).slice(0, 5)}`,
      pcn_name: incomplete ? '' : random.pick(PCNS),
      sub_icb: random.pick(SUB_ICBS),
      address_line_1: `${random.int(1, 240)} ${random.pick(PLACES)} Road`,
      address_line_2: '',
      city: random.pick(CITIES),
      postcode: `LS${random.int(1, 29)} ${random.int(1, 9)}${random.pick(['AB', 'DF', 'HQ', 'NR', 'TX'])}`,
      country: null,
      phone_number: incomplete ? '' : `+44 113 ${random.int(200, 999)} ${random.int(1000, 9999)}`,
      email_address: random.bool(0.8) ? `${emailUser}@nhs.demo` : null,
      website: null,
      description: null,
      // A few practices have an uploaded logo, so the grid shows both the logo and initials variants.
      logo_url: index % 9 === 4 ? '/aqlios_logo.svg' : '',
      cqc_no: null,
      practice_manager_name: manager?.full_name ?? '',
      practice_manager: manager?.id ?? null,
      associated_users_count: random.int(0, 60),
      status: 'ACTIVE',
      is_active: true,
      sla_status: random.bool(0.7),
      activity_tracker_enabled: random.bool(0.4),
      inactivity_threshold_minutes: null,
      is_career_page_active: false,
      uses_connect: random.bool(0.3),
      commission_percentage: null,
      payout_eligibility_days: null,
      points_of_contact: [],
      slug: null,
      tenant_id: null,
      app_id: null,
      operating_hours: operatingHours(id, createdAt, random.bool(0.6)),
      created_at: createdAt,
      updated_at: createdAt,
      deleted_at: null,
      rota_group_ids: index % 4 === 0 ? [rotaGroups[0].id] : [],
      linked_practice_ids: [],
      succession_start_date: isUnconfiguredFixture(index) ? null : createdAt.slice(0, 10),
      succession_ongoing: true,
      succession_end_date: null,
      workforce_allocations: isUnconfiguredFixture(index) ? [] : [{ staff_type: 'GP', frequency: 'DAILY', hours: 8 }],
    };
  });
}
