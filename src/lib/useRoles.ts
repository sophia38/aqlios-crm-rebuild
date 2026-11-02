'use client';

import { useEffect, useState } from 'react';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import type { Role } from '@/lib/api/types';
import { usersApi } from '@/lib/api/users';

/** Every role, for Role selects and filters (`?is_paginated=false`). */
export function useRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    usersApi
      .allRoles(PUBLIC_SUB_APP_ID, controller.signal)
      .then(setRoles)
      .catch(() => undefined);
    return () => controller.abort();
  }, []);
  return roles;
}
