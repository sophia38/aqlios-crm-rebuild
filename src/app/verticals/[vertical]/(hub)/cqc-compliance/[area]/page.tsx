import { notFound } from 'next/navigation';
import { CqcActionPlanPage } from '@/features/cqc/CqcActionPlanPage';
import { CqcAreaPage } from '@/features/cqc/CqcAreaPage';
import { CqcSurveyPage } from '@/features/cqc/CqcSurveyPage';
import { CQC_CHECK_AREAS, CQC_SURVEY_AREA } from '@/lib/api/cqc';

// The static export needs every area spelled out.
export const dynamicParams = false;

export function generateStaticParams() {
  return [...CQC_CHECK_AREAS.map(({ key }) => ({ area: key })), { area: CQC_SURVEY_AREA.key }, { area: 'action-plan' }];
}

export default async function Page({ params }: { params: Promise<{ area: string }> }) {
  const { area } = await params;
  if (area === 'action-plan') return <CqcActionPlanPage />;
  if (area === CQC_SURVEY_AREA.key) return <CqcSurveyPage />;
  const match = CQC_CHECK_AREAS.find((item) => item.key === area);
  if (!match) notFound();
  return <CqcAreaPage key={match.key} area={match.key} />;
}
