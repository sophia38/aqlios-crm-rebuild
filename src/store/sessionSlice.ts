import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { authApi } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/http';
import type { AuthUser } from '@/lib/api/types';

// The session comes from /api/auth/me and is never persisted: the auth service is the source of truth.
export interface SessionState {
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated' | 'error';
  user: AuthUser | null;
  error: string | null;
}

const initialState: SessionState = { status: 'idle', user: null, error: null };

export const fetchSession = createAsyncThunk('session/fetch', async (_, { rejectWithValue }) => {
  try {
    const me = await authApi.me();
    return me.user;
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) return null;
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to load session');
  }
});

export const signOut = createAsyncThunk('session/signOut', async () => {
  await authApi.logout().catch(() => undefined);
});

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSession.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchSession.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = action.payload ? 'authenticated' : 'unauthenticated';
      })
      .addCase(fetchSession.rejected, (state, action) => {
        state.status = 'error';
        state.error = (action.payload as string | undefined) ?? 'Failed to load session';
      })
      .addCase(signOut.fulfilled, (state) => {
        state.user = null;
        state.status = 'unauthenticated';
      });
  },
});

export const sessionReducer = sessionSlice.reducer;
