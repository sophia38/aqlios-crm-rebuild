'use client';

import { Fragment, useState } from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import ExpandMore from '@mui/icons-material/ExpandMore';
import type { DataTableColumn } from './DataTable';

export interface TableGroup<Row> {
  id: string;
  title: string;
  /** Right of the title, e.g. "2 of 5 active". */
  summary?: string;
  rows: Row[];
}

export interface GroupedDataTableProps<Row> {
  groups: TableGroup<Row>[];
  columns: DataTableColumn<Row>[];
  getRowId: (row: Row) => string;
  loading?: boolean;
  error?: string | null;
  emptyMessage: string;
  'aria-label': string;
  minWidth?: number;
}

/**
 * Table with collapsible group header rows (COMPONENTS.md → GroupedDataTable; reference: Pathway
 * Configuration). Scrolls sideways inside its card instead of overflowing it (live bug).
 */
export function GroupedDataTable<Row>({
  groups,
  columns,
  getRowId,
  loading = false,
  error = null,
  emptyMessage,
  'aria-label': ariaLabel,
  minWidth = 960,
}: GroupedDataTableProps<Row>) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const message = (text: string, color?: string) => (
    <TableRow>
      <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
        <Typography variant="body2" sx={{ color }}>
          {text}
        </Typography>
      </TableCell>
    </TableRow>
  );

  return (
    <Paper
      variant="outlined"
      sx={(theme) => ({ overflow: 'hidden', borderColor: theme.tokens.border.medium, borderRadius: '16px' })}
    >
      <TableContainer>
        <Table aria-label={ariaLabel} aria-busy={loading || undefined} sx={{ minWidth }}>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  sx={{ width: column.width, fontWeight: 600, color: 'text.primary', whiteSpace: 'nowrap' }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading &&
              Array.from({ length: 5 }, (_, index) => (
                <TableRow key={`loading-${index}`}>
                  {columns.map((column) => (
                    <TableCell key={column.id}>
                      <Skeleton variant="text" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {!loading && error && message(error, 'error.main')}
            {!loading && !error && groups.length === 0 && message(emptyMessage)}
            {!loading &&
              !error &&
              groups.map((group) => {
                const open = !collapsed.has(group.id);
                return (
                  <Fragment key={group.id}>
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        sx={(theme) => ({ p: 0, bgcolor: theme.tokens.neutral[100] })}
                      >
                        <ButtonBase
                          aria-expanded={open}
                          onClick={() =>
                            setCollapsed((current) => {
                              const next = new Set(current);
                              if (next.has(group.id)) next.delete(group.id);
                              else next.add(group.id);
                              return next;
                            })
                          }
                          sx={{ width: '100%', justifyContent: 'flex-start', gap: 1, px: 2, py: 1.25 }}
                        >
                          <ExpandMore
                            aria-hidden
                            sx={(theme) => ({
                              fontSize: 20,
                              transform: open ? 'none' : 'rotate(-90deg)',
                              transition: theme.transitions.create('transform'),
                            })}
                          />
                          <Typography component="span" sx={{ fontSize: 14, fontWeight: 600, color: 'text.primary' }}>
                            {group.title}
                          </Typography>
                          {group.summary && (
                            <Box component="span" sx={{ fontSize: 12, color: 'text.secondary' }}>
                              {group.summary}
                            </Box>
                          )}
                        </ButtonBase>
                      </TableCell>
                    </TableRow>
                    {open &&
                      group.rows.map((row) => (
                        <TableRow key={getRowId(row)} hover>
                          {columns.map((column) => (
                            <TableCell key={column.id} align={column.align}>
                              {column.render(row)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                  </Fragment>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
