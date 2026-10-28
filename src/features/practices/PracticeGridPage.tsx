'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import TablePagination from '@mui/material/TablePagination';
import Typography from '@mui/material/Typography';
import AddCircleOutline from '@mui/icons-material/AddCircleOutlineOutlined';
import GridViewOutlined from '@mui/icons-material/GridViewOutlined';
import { DataTable } from '@/components/data/DataTable';
import { HubManagementLayout } from '@/components/layout/HubManagementLayout';
import { ModulePageHeader } from '@/components/layout/ModulePageHeader';
import { ViewModeToggle } from '@/components/navigation/ViewModeToggle';
import { HubCard } from '@/components/practice/HubCard';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { practiceManagementApi, practiceSlug } from '@/lib/api/practiceManagement';
import type { Practice } from '@/lib/api/types';
import { setPracticeViewMode } from '@/store/uiSlice';
import { selectSession, selectUi, useAppDispatch, useAppSelector } from '@/store';
import { ONBOARD_HREF, practiceColumns } from './PracticeManagementListPage';
import { usePracticeList } from './usePracticeList';

/** Dashboard practice grid: reference screen for card grids (docs/super-admin/01-verticals-and-practice-list.md §2). */
export function PracticeGridPage({ vertical }: { vertical: string }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(selectSession);
  const { practiceViewMode } = useAppSelector(selectUi);
  const isAdmin = Boolean(user?.isAdmin);
  const list = usePracticeList({ pageSize: 12 });

  const open = (practice: Practice) => {
    // Practice users record their current practice on the server, as live; the URL stays the source of truth.
    if (user && !isAdmin) {
      void practiceManagementApi.selectBusiness(PUBLIC_SUB_APP_ID, user.id, practice.id).catch(() => undefined);
    }
    router.push(`/verticals/${vertical}/practices/${practiceSlug(practice.practice_name)}/dashboard`);
  };

  const emptyMessage = isAdmin
    ? 'No practices found.'
    : "You aren't linked to any practice yet. Ask your administrator.";

  const pagination = (
    <TablePagination
      component="div"
      count={list.count}
      page={list.query.page}
      rowsPerPage={list.query.pageSize}
      rowsPerPageOptions={[12, 24, 48]}
      onPageChange={(_, page) => list.setPage(page)}
      onRowsPerPageChange={(event) => list.setPageSize(Number(event.target.value))}
      sx={(theme) => ({ borderTop: `1px solid ${theme.tokens.border.medium}`, mt: 3 })}
    />
  );

  return (
    <HubManagementLayout>
      <ModulePageHeader
        icon={<GridViewOutlined />}
        title="Public Practice"
        subtitle="Practice List"
        actions={
          <>
            {isAdmin && (
              <Button
                component={Link}
                href={ONBOARD_HREF}
                variant="contained"
                startIcon={<AddCircleOutline />}
                sx={(theme) => ({ borderRadius: `${theme.tokens.radius.pill}px` })}
              >
                Onboard New Practice
              </Button>
            )}
            <ViewModeToggle value={practiceViewMode} onChange={(mode) => dispatch(setPracticeViewMode(mode))} />
          </>
        }
      />

      {practiceViewMode === 'list' ? (
        <DataTable<Practice>
          aria-label="Practices"
          columns={practiceColumns().filter((column) => column.id !== 'actions')}
          rows={list.rows}
          getRowId={(practice) => practice.id}
          page={list.query.page}
          rowsPerPage={list.query.pageSize}
          rowsPerPageOptions={[12, 24, 48]}
          totalCount={list.count}
          onPageChange={list.setPage}
          onRowsPerPageChange={list.setPageSize}
          loading={list.loading}
          error={list.error}
          emptyMessage={emptyMessage}
          onRowClick={open}
        />
      ) : (
        <Box>
          {list.error && !list.loading ? (
            <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
              <Typography sx={{ color: 'error.main', mb: 2 }}>{list.error}</Typography>
              <Button variant="outlined" onClick={list.reload}>
                Try again
              </Button>
            </Paper>
          ) : !list.loading && list.rows.length === 0 ? (
            <Typography variant="body2" sx={{ textAlign: 'center', py: 6 }}>
              {emptyMessage}
            </Typography>
          ) : (
            <Box
              component="ul"
              aria-label="Practices"
              aria-busy={list.loading || undefined}
              sx={{
                listStyle: 'none',
                m: 0,
                p: 0,
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                gap: 2,
              }}
            >
              {list.loading
                ? Array.from({ length: list.query.pageSize }, (_, index) => (
                    <li key={index}>
                      <Skeleton
                        variant="rounded"
                        height={84}
                        sx={(theme) => ({ borderRadius: `${theme.tokens.radius.card}px` })}
                      />
                    </li>
                  ))
                : list.rows.map((practice) => (
                    <li key={practice.id}>
                      <HubCard
                        name={practice.practice_name}
                        logoSrc={practice.logo_url}
                        onSelect={() => open(practice)}
                      />
                    </li>
                  ))}
            </Box>
          )}
          {pagination}
        </Box>
      )}
    </HubManagementLayout>
  );
}
