import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// UI preferences kept across reloads (persisted in src/store/index.ts).
export interface UiState {
  practiceSidebarCollapsed: boolean;
  /** Practice grid view (Dashboard): grid is the live default. */
  practiceViewMode: 'grid' | 'list';
}

const initialState: UiState = { practiceSidebarCollapsed: false, practiceViewMode: 'grid' };

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    togglePracticeSidebar: (state) => {
      state.practiceSidebarCollapsed = !state.practiceSidebarCollapsed;
    },
    setPracticeViewMode: (state, action: PayloadAction<UiState['practiceViewMode']>) => {
      state.practiceViewMode = action.payload;
    },
  },
});

export const { togglePracticeSidebar, setPracticeViewMode } = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
