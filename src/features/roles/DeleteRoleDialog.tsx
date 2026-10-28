'use client';

import { useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { ApiError } from '@/lib/api/http';
import type { Role, RoleUser } from '@/lib/api/types';
import { ROLE_ERROR_MESSAGES, usersApi } from '@/lib/api/users';

type Loaded = { roleId: string; users: RoleUser[]; roles: Role[] } | { roleId: string; error: string };

/** Every user assigned to a role (the API pages at most 100 at a time). */
async function allUsers(roleId: string, signal: AbortSignal) {
  const users: RoleUser[] = [];
  for (let page = 1; ; page += 1) {
    const result = await usersApi.roleUsers(PUBLIC_SUB_APP_ID, roleId, { page, page_size: 100 }, signal);
    users.push(...result.results);
    if (!result.next) return users;
  }
}

/**
 * Delete Role (docs/practice/09-confirmation-popups.md, design B) in the standard ConfirmDialog.
 * Users still on the role must each be moved to another role before Delete Role is enabled.
 */
export function DeleteRoleDialog({
  role,
  onClose,
  onDeleted,
}: {
  role: Role | null;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [targets, setTargets] = useState<Record<string, Role | null>>({});
  const [deleting, setDeleting] = useState(false);
  const roleId = role?.id;

  useEffect(() => {
    if (!roleId) return;
    const controller = new AbortController();
    Promise.all([allUsers(roleId, controller.signal), usersApi.allRoles(PUBLIC_SUB_APP_ID, controller.signal)])
      .then(([users, roles]) => setLoaded({ roleId, users, roles: roles.filter((item) => item.id !== roleId) }))
      .catch(() => {
        if (!controller.signal.aborted) setLoaded({ roleId, error: 'Failed to load associated users' });
      });
    return () => controller.abort();
  }, [roleId]);

  // Ignore results left over from a previously opened role.
  const current = loaded && loaded.roleId === roleId ? loaded : null;
  const users = current && 'users' in current ? current.users : [];
  const options = current && 'roles' in current ? current.roles : [];
  const ready = Boolean(current && 'users' in current);
  const allReassigned = users.every((user) => targets[user.id]);

  const close = () => {
    setTargets({});
    setLoaded(null);
    onClose();
  };

  const confirm = async () => {
    if (!role) return;
    setDeleting(true);
    try {
      await usersApi.deleteRole(PUBLIC_SUB_APP_ID, role.id, {
        reassignments: users.map((user) => ({ user_id: user.id, role_id: targets[user.id]!.id })),
      });
      enqueueSnackbar('Role deleted successfully', { variant: 'success' });
      setTargets({});
      setLoaded(null);
      onDeleted();
    } catch (error) {
      const code = error instanceof ApiError ? error.code : 500;
      enqueueSnackbar(ROLE_ERROR_MESSAGES[code] ?? ROLE_ERROR_MESSAGES[500], { variant: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ConfirmDialog
      open={Boolean(role)}
      title="Delete Role"
      message={<>Are you sure you want to delete the role &quot;{role?.name}&quot;?</>}
      warning={
        users.length > 0 && (
          <>
            Warning: <strong>{users.length} user(s)</strong> are assigned to this role.
            <br />
            Please reassign these users to another role before deleting.
          </>
        )
      }
      confirmButtonText="Delete Role"
      confirmButtonDisabled={!ready || !allReassigned}
      confirmButtonLoading={deleting}
      onClose={close}
      onConfirm={confirm}
    >
      {!current && <LoadingSpinner message="Checking associated users..." size={24} />}
      {current && 'error' in current && (
        <Typography variant="body2" sx={{ mt: 2, color: 'error.main' }}>
          {current.error}
        </Typography>
      )}
      {users.length > 0 && (
        <Stack spacing={1.5} sx={{ mt: 2 }}>
          {users.map((user) => (
            <Box
              key={user.id}
              sx={(theme) => ({
                p: 1.5,
                borderRadius: `${theme.tokens.radius.input}px`,
                bgcolor: theme.tokens.neutral[100],
              })}
            >
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'text.primary' }}>
                {user.first_name} {user.last_name}
              </Typography>
              <Typography variant="caption" component="p" sx={{ mb: 1.5 }}>
                {user.email}
              </Typography>
              <Autocomplete
                size="small"
                options={options}
                value={targets[user.id] ?? null}
                onChange={(_, value) => setTargets((current) => ({ ...current, [user.id]: value }))}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                disabled={deleting}
                renderInput={(params) => (
                  <TextField {...params} required label="Reassign User To Role" sx={{ bgcolor: 'background.paper' }} />
                )}
              />
            </Box>
          ))}
        </Stack>
      )}
    </ConfirmDialog>
  );
}
