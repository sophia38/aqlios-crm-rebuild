import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { FLUSH, PAUSE, PERSIST, persistReducer, persistStore, PURGE, REGISTER, REHYDRATE } from 'redux-persist';
import createWebStorage from 'redux-persist/lib/storage/createWebStorage';
import { sessionReducer } from './sessionSlice';
import { uiReducer } from './uiSlice';

// localStorage on the client; a no-op store during the static build (no window).
const storage =
  typeof window === 'undefined'
    ? {
        getItem: async () => null,
        setItem: async (_key: string, value: string) => value,
        removeItem: async () => undefined,
      }
    : createWebStorage('local');

// Only UI preferences are persisted; the session always comes from /api/auth/me.
const rootReducer = combineReducers({
  session: sessionReducer,
  ui: persistReducer({ key: 'aqlios-ui', version: 1, storage }, uiReducer),
});

export function makeStore() {
  return configureStore({
    reducer: rootReducer,
    middleware: (getDefault) =>
      getDefault({ serializableCheck: { ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER] } }),
  });
}

export function makePersistor(store: AppStore) {
  return persistStore(store);
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

export const selectSession = (state: RootState) => state.session;
export const selectUi = (state: RootState) => state.ui;
