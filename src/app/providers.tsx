'use client';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { SnackbarProvider } from 'notistack';
import 'dayjs/locale/en-gb';
import { theme } from '@/theme/theme';
import { MockProvider } from '@/mocks/MockProvider';
import { StoreProvider } from '@/store/StoreProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
        <SnackbarProvider
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transitionDuration={{ enter: 225, exit: 195 }}
          maxSnack={3}
        >
          <MockProvider>
            <StoreProvider>{children}</StoreProvider>
          </MockProvider>
        </SnackbarProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}
