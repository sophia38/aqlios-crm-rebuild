// GitHub Pages serves the app under /<repo>; files in public/ must be referenced with that prefix.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export function asset(path: string) {
  return `${BASE_PATH}${path.startsWith('/') ? path : `/${path}`}`;
}
