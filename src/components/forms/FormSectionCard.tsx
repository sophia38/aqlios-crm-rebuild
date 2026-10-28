'use client';

import { useId, useState } from 'react';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

export interface FormSectionCardProps {
  title: React.ReactNode;
  icon?: React.ReactNode;
  /** Red border when any field inside is invalid, even while collapsed (live behaviour). */
  hasError?: boolean;
  defaultExpanded?: boolean;
  /** Controlled open state (e.g. to open a section that holds the first error). */
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  /** Header actions next to the chevron, e.g. "Add Another POC". */
  actions?: React.ReactNode;
  children: React.ReactNode;
}

/** Collapsible white card for one form section (COMPONENTS.md → FormSectionCard). */
export function FormSectionCard({
  title,
  icon,
  hasError = false,
  defaultExpanded = true,
  expanded,
  onExpandedChange,
  actions,
  children,
}: FormSectionCardProps) {
  const [localOpen, setLocalOpen] = useState(defaultExpanded);
  const open = expanded ?? localOpen;
  const contentId = useId();
  const toggle = () => {
    setLocalOpen(!open);
    onExpandedChange?.(!open);
  };

  return (
    <Box
      component="section"
      sx={(theme) => ({
        bgcolor: 'background.paper',
        borderRadius: `${theme.tokens.radius.card}px`,
        border: `1px solid ${hasError ? theme.palette.error.main : theme.tokens.border.medium}`,
        transition: theme.transitions.create('border-color'),
      })}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: { xs: 2, md: 3 }, py: 2 }}>
        {icon && (
          <Box aria-hidden sx={{ display: 'flex', color: 'primary.main' }}>
            {icon}
          </Box>
        )}
        <Typography component="h2" variant="sectionTitle" sx={{ flex: 1, fontSize: { xs: 17, md: 20 } }}>
          {title}
        </Typography>
        {actions}
        <IconButton
          onClick={toggle}
          aria-expanded={open}
          aria-controls={contentId}
          aria-label={open ? 'Collapse section' : 'Expand section'}
          size="small"
        >
          {open ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>
      <Collapse in={open} id={contentId}>
        <Divider />
        <Box sx={{ px: { xs: 2, md: 3 }, py: 3 }}>{children}</Box>
      </Collapse>
    </Box>
  );
}
