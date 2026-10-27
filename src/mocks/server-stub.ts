// Server-side stand-in for `msw/browser`, which MSW marks as browser-only. The mock worker is only
// ever started in the browser (src/mocks/MockProvider.tsx); this keeps the server bundle building.
export function setupWorker(): never {
  throw new Error('msw/browser is not available during server rendering');
}
