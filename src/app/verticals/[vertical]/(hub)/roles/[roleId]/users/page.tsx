import { AssociatedUsersPage } from '@/features/roles/AssociatedUsersPage';

export default async function Page({ params }: { params: Promise<{ roleId: string }> }) {
  const { roleId } = await params;
  return <AssociatedUsersPage roleId={roleId} />;
}
