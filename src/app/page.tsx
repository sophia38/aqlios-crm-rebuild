'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// Phase 0 theme check. Phase 1 replaces this page with a redirect to /auth/login.
export default function Home() {
  return (
    <Box component="main" sx={{ p: 4, bgcolor: 'background.default' }}>
      <Paper
        variant="outlined"
        sx={(theme) => ({ p: 4, bgcolor: theme.tokens.surface.panel, maxWidth: 720, mx: 'auto' })}
      >
        <Typography variant="pageTitle" component="h1">
          Aqlios rebuild: theme check
        </Typography>
        <Typography variant="body2" sx={{ mb: 3 }}>
          Fonts, colours, radii and inputs come from src/theme. This page is replaced in phase 1.
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: 'wrap' }}>
          <Button variant="contained">Save Changes</Button>
          <Button variant="outlined">Cancel</Button>
          <Button variant="contained" color="brand">
            Login
          </Button>
          <Button variant="contained" color="error">
            Delete
          </Button>
        </Stack>
        <Stack spacing={2}>
          <TextField label="Practice Name" required placeholder="Enter practice name" />
          <TextField label="Email" error helperText="Enter a valid email" defaultValue="not-an-email" />
        </Stack>
      </Paper>
    </Box>
  );
}
