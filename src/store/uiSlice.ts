import { createSlice } from '@reduxjs/toolkit';

// UI preferences kept across reloads (persisted in src/store/index.ts).
export interface UiState {
  practiceSidebarCollapsed: boolean;
}

const initialState: UiState = { practiceSidebarCollapsed: false };

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    togglePracticeSidebar: (state) => {
      state.practiceSidebarCollapsed = !state.practiceSidebarCollapsed;
    },
  },
});

export const { togglePracticeSidebar } = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
