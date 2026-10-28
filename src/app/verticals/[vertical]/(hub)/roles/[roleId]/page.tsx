import { RoleFormPage } from '@/features/roles/RoleFormPage';

export default async function Page({ params }: { params: Promise<{ roleId: string }> }) {
  const { roleId } = await params;
  return <RoleFormPage roleId={roleId} />;
}
