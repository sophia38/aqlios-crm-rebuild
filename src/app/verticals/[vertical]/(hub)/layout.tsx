import { HubFrame } from '@/features/shell/HubFrame';

export default async function HubLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ vertical: string }>;
}) {
  const { vertical } = await params;
  return <HubFrame vertical={vertical}>{children}</HubFrame>;
}
