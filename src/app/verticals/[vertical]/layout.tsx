// Only Public Primary Care is in scope; Private Business has its own static placeholder route.
export function generateStaticParams() {
  return [{ vertical: 'public' }];
}

export default function VerticalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
