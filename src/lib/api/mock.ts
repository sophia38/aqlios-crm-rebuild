// Mock-only dev endpoints (docs/api-shapes.md → "Mock-only endpoints"). Never called in live mode.
export type DemoPersona = 'super-admin' | 'practice-user';

export const DEMO_PERSONAS: { id: DemoPersona; label: string }[] = [
  { id: 'super-admin', label: 'Super-admin (Vertical Admin)' },
  { id: 'practice-user', label: 'Practice user (GP)' },
];

async function post(path: string, body?: unknown) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
}

export const mockApi = {
  setPersona: (persona: DemoPersona) => post('/api/mock/persona', { persona }),
  reset: () => post('/api/mock/reset'),
};
