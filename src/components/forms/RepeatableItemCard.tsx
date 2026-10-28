'use client';

import { useId, useState } from 'react';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DeleteOutline from '@mui/icons-material/DeleteOutlineOutlined';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

export interface RepeatableItemCardProps {
  /** e.g. "Person 1", "Workforce Allocation 2", "Slot Duration 1". */
  title: string;
  icon?: React.ReactNode;
  /** Omit to hide 🗑 (the first Slot Duration can't be removed). Deletes immediately, as live. */
  onDelete?: () => void;
  hasError?: boolean;
  children: React.ReactNode;
}

/**
 * Grey sub-card for one item of a repeating group: icon, "{Label} N", 🗑 and a collapse chevron
 * (approved new component; replaces three copies in the live app).
 */
export function RepeatableItemCard({ title, icon, onDelete, hasError = false, children }: RepeatableItemCardProps) {
  const [open, setOpen] = useState(true);
  const contentId = useId();
  return (
    <Box
      sx={(theme) => ({
        bgcolor: theme.tokens.surface.subtleFill,
        borderRadius: `${theme.tokens.radius.input}px`,
        border: `1px solid ${hasError ? theme.palette.error.main : theme.tokens.border.medium}`,
      })}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.25 }}>
        {icon && (
          <Box aria-hidden sx={{ display: 'flex', color: 'primary.main' }}>
            {icon}
          </Box>
        )}
        <Typography component="h3" sx={{ flex: 1, fontSize: 14, fontWeight: 600 }}>
          {title}
        </Typography>
        {onDelete && (
          <IconButton aria-label={`Delete ${title}`} onClick={onDelete} size="small" sx={{ color: 'error.main' }}>
            <DeleteOutline fontSize="small" />
          </IconButton>
        )}
        <IconButton
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls={contentId}
          aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
          size="small"
        >
          {open ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
        </IconButton>
      </Box>
      <Collapse in={open} id={contentId}>
        <Box sx={{ px: 2, pb: 2 }}>{children}</Box>
      </Collapse>
    </Box>
  );
}
