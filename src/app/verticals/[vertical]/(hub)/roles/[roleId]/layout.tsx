import { buildRoles } from '@/mocks/fixtures/users';

// The seeded roles are pre-built so their URLs match the live app. Roles created in the demo have no
// pre-built page; the static host's not-found page renders them instead (src/app/not-found.tsx).
export function generateStaticParams() {
  return buildRoles().map((role) => ({ roleId: role.id }));
}

export default function RoleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
