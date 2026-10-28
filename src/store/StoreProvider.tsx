'use client';

import { useState } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { makePersistor, makeStore } from './index';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [{ store, persistor }] = useState(() => {
    const created = makeStore();
    return { store: created, persistor: makePersistor(created) };
  });
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}
