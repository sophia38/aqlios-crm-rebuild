import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import type { OperatingHours, Practice } from '@/lib/api/types';
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
const MANAGERS = ['Jordan Hale', 'Priya Nair', 'Tom Ellis', 'Grace Okafor', 'Liam Carter', 'Hannah Moss'] as const;
const DAYS: OperatingHours['day'][] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

export const PRACTICE_COUNT = 155;

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

export function buildPractices(): Practice[] {
  const random = createRandom(155);
  return practiceNames(PRACTICE_COUNT).map((name, index) => {
    const id = mockId('practice', index);
    const createdAt = isoDaysAgo(index * 2 + random.int(0, 1), random.int(8, 17));
    // Some practices have incomplete profiles (empty PCN or phone), like the live list's orange rows.
    const incomplete = random.bool(0.12);
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
      email_address: null,
      website: null,
      description: null,
      logo_url: '',
      cqc_no: null,
      practice_manager_name: random.pick(MANAGERS),
      associated_users_count: random.int(0, 60),
      status: incomplete ? 'INCOMPLETE' : 'ACTIVE',
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
    };
  });
}
