'use client';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ErrorOutline from '@mui/icons-material/ErrorOutlineOutlined';

export interface DataTableColumn<Row> {
  id: string;
  label: string;
  render: (row: Row) => React.ReactNode;
  /** API field for `ordering`; set it to make the column sortable. */
  sortKey?: string;
  align?: 'left' | 'center' | 'right';
  width?: number | string;
}

export type RowState = 'incomplete';

export interface DataTableProps<Row> {
  columns: DataTableColumn<Row>[];
  rows: Row[];
  getRowId: (row: Row) => string;
  /** Django-style ordering: `created_at` or `-created_at`. */
  ordering?: string;
  onOrderingChange?: (ordering: string) => void;
  /** 0-based page index (MUI); the API is 1-based. */
  page: number;
  rowsPerPage: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  rowsPerPageOptions?: number[];
  loading?: boolean;
  error?: string | null;
  /** e.g. "No practices found. Try another search." */
  emptyMessage: string;
  getRowState?: (row: Row) => RowState | undefined;
  /** Tooltip / label on the incomplete-row icon. */
  incompleteLabel?: string;
  labelDisplayedRows?: (info: { from: number; to: number; count: number; page: number }) => React.ReactNode;
  'aria-label': string;
  minWidth?: number;
}

/**
 * MUI table with API-driven sorting, row states and pagination (COMPONENTS.md → DataTable).
 * Reference: Practice Management list (docs/super-admin/02-practice-onboarding.md).
 */
export function DataTable<Row>({
  columns,
  rows,
  getRowId,
  ordering,
  onOrderingChange,
  page,
  rowsPerPage,
  totalCount,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [10, 25, 50],
  loading = false,
  error = null,
  emptyMessage,
  getRowState,
  incompleteLabel = 'Profile is incomplete',
  labelDisplayedRows,
  'aria-label': ariaLabel,
  minWidth = 720,
}: DataTableProps<Row>) {
  const sortField = ordering?.replace(/^-/, '');
  const sortDirection: 'asc' | 'desc' = ordering?.startsWith('-') ? 'desc' : 'asc';

  const toggleSort = (key: string) => {
    if (!onOrderingChange) return;
    // Same column: flip direction. New column: start descending, like the live Date Added default.
    onOrderingChange(sortField === key && sortDirection === 'desc' ? key : `-${key}`);
  };

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
              {columns.map((column) => {
                const active = column.sortKey !== undefined && column.sortKey === sortField;
                return (
                  <TableCell
                    key={column.id}
                    align={column.align}
                    sx={{ width: column.width, fontWeight: 600, color: 'text.primary', whiteSpace: 'nowrap' }}
                    aria-sort={active ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
                  >
                    {column.sortKey && onOrderingChange ? (
                      <TableSortLabel
                        active={active}
                        direction={active ? sortDirection : 'desc'}
                        onClick={() => toggleSort(column.sortKey!)}
                      >
                        {column.label}
                      </TableSortLabel>
                    ) : (
                      column.label
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading &&
              Array.from({ length: Math.min(rowsPerPage, 5) }, (_, index) => (
                <TableRow key={`loading-${index}`}>
                  {columns.map((column) => (
                    <TableCell key={column.id}>
                      <Skeleton variant="text" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {!loading && error && message(error, 'error.main')}
            {!loading && !error && rows.length === 0 && message(emptyMessage)}
            {!loading &&
              !error &&
              rows.map((row) => {
                const state = getRowState?.(row);
                const incomplete = state === 'incomplete';
                return (
                  <TableRow
                    key={getRowId(row)}
                    hover
                    sx={(theme) =>
                      incomplete
                        ? {
                            bgcolor: theme.tokens.rowState.incomplete.bg,
                            '& > td:first-of-type': {
                              boxShadow: `inset 3px 0 0 ${theme.tokens.rowState.incomplete.border}`,
                            },
                          }
                        : {}
                    }
                  >
                    {columns.map((column, index) => (
                      <TableCell key={column.id} align={column.align}>
                        {index === 0 && incomplete ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Tooltip title={incompleteLabel}>
                              <ErrorOutline
                                aria-label={incompleteLabel}
                                sx={(theme) => ({ fontSize: 18, color: theme.tokens.rowState.incomplete.border })}
                              />
                            </Tooltip>
                            {column.render(row)}
                          </Box>
                        ) : (
                          column.render(row)
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={rowsPerPageOptions}
        onPageChange={(_, next) => onPageChange(next)}
        onRowsPerPageChange={(event) => onRowsPerPageChange(Number(event.target.value))}
        labelDisplayedRows={labelDisplayedRows}
        sx={(theme) => ({ borderTop: `1px solid ${theme.tokens.border.medium}` })}
      />
    </Paper>
  );
}
