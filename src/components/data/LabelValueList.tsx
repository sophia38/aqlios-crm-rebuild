import Box from '@mui/material/Box';

export interface LabelValueItem {
  label: string;
  /** Empty values show "-", as in the live read-only cards. */
  value: React.ReactNode;
}

export interface LabelValueListProps {
  items: LabelValueItem[];
  /** `inverse`: light text for dark surfaces such as tooltips. */
  tone?: 'default' | 'inverse';
  dense?: boolean;
  labelWidth?: number;
}

/**
 * Label-left, value-right rows as a description list (COMPONENTS.md → LabelValueList). Used for the
 * carer tooltip, the file viewer and, in later modules, consultation and leave details.
 */
export function LabelValueList({ items, tone = 'default', dense = false, labelWidth = 120 }: LabelValueListProps) {
  return (
    <Box
      component="dl"
      sx={(theme) => ({
        m: 0,
        display: 'grid',
        gridTemplateColumns: `minmax(0, ${labelWidth}px) minmax(0, 1fr)`,
        columnGap: 1.5,
        rowGap: dense ? 0.5 : 1,
        fontSize: dense ? 12 : 14,
        '& dt': {
          color: tone === 'inverse' ? theme.tokens.neutral[300] : theme.tokens.text.secondary,
          fontWeight: 500,
        },
        '& dd': {
          m: 0,
          color: tone === 'inverse' ? theme.palette.common.white : theme.palette.text.primary,
          overflowWrap: 'anywhere',
        },
      })}
    >
      {items.map((item) => (
        <Box key={item.label} sx={{ display: 'contents' }}>
          <dt>{item.label}</dt>
          <dd>{item.value === '' || item.value === null || item.value === undefined ? '-' : item.value}</dd>
        </Box>
      ))}
    </Box>
  );
}
