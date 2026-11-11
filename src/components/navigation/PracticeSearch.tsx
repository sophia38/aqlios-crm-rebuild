'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import type { SvgIconComponent } from '@mui/icons-material';
import Autocomplete from '@mui/material/Autocomplete';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Search from '@mui/icons-material/Search';
import { initials } from '@/components/layout/UserMenu';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { practiceManagementApi, practiceSlug } from '@/lib/api/practiceManagement';
import { selectSession, useAppSelector } from '@/store';

export interface SearchPage {
  label: string;
  href: string;
  icon: SvgIconComponent;
}

interface Option {
  kind: 'practice' | 'page';
  id: string;
  label: string;
  sub?: string;
  href: string;
  practiceId?: string;
  icon?: SvgIconComponent;
}

export interface PracticeSearchProps {
  /** `global`: the top bar's search over practices and pages (⌘K). `jump`: the large box on /verticals (/). */
  variant: 'global' | 'jump';
  vertical?: string;
  /** Pages offered by the global search (the current user's menu). */
  pages?: SearchPage[];
}

const DEBOUNCE_MS = 200;
const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (/INPUT|TEXTAREA|SELECT/.test(target.tagName) || target.isContentEditable);

/**
 * Search box from the refined prototype (COMPONENTS.md → PracticeSearch): practices by name from the
 * practice list API, plus menu pages in the global variant. Built on MUI Autocomplete, so the
 * combobox roles, arrow keys, Enter and Esc come for free.
 */
export function PracticeSearch({ variant, vertical = 'public', pages = [] }: PracticeSearchProps) {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAppSelector(selectSession);
  const inputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState('');
  const [focused, setFocused] = useState(false);
  const [practices, setPractices] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const query = input.trim();
  const jump = variant === 'jump';

  useEffect(() => {
    if (!query) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      practiceManagementApi
        .practices(PUBLIC_SUB_APP_ID, { search: query, page_size: jump ? 6 : 4 }, controller.signal)
        .then(({ results }) =>
          setPractices(
            results.map((practice) => ({
              kind: 'practice',
              id: practice.id,
              label: practice.practice_name,
              sub: practice.practice_manager_name || undefined,
              href: `/verticals/${vertical}/practices/${practiceSlug(practice.practice_name)}/dashboard`,
              practiceId: practice.id,
            })),
          ),
        )
        .catch(() => {
          if (!controller.signal.aborted) enqueueSnackbar('Failed to search practices', { variant: 'error' });
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, jump, vertical, enqueueSnackbar]);

  // "/" (and ⌘K / Ctrl+K for the global search) focuses the box from anywhere on the page.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const shortcut =
        (event.key === '/' && !isTyping(event.target)) ||
        (!jump && (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k');
      if (!shortcut) return;
      event.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [jump]);

  const pageOptions: Option[] = jump
    ? []
    : pages
        .filter((page) => page.label.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 4)
        .map((page) => ({
          kind: 'page',
          id: page.href,
          label: page.label,
          sub: 'Go to page',
          href: page.href,
          icon: page.icon,
        }));
  const options = query ? [...practices, ...pageOptions] : [];

  const go = (option: Option) => {
    // Practice users record their current practice, as the practice grid does.
    if (option.practiceId && user && !user.isAdmin) {
      void practiceManagementApi.selectBusiness(PUBLIC_SUB_APP_ID, user.id, option.practiceId).catch(() => undefined);
    }
    setInput('');
    inputRef.current?.blur();
    router.push(option.href);
  };

  const label = jump ? 'Jump to a practice' : 'Find practices and pages';

  return (
    <Autocomplete<Option, false, true, false>
      options={options}
      value={null as unknown as Option}
      inputValue={input}
      onInputChange={(_, value, reason) => {
        if (reason !== 'reset') setInput(value);
      }}
      onChange={(_, option) => option && go(option)}
      open={focused && Boolean(query)}
      onOpen={() => setFocused(true)}
      onClose={() => setFocused(false)}
      filterOptions={(items) => items}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      groupBy={jump ? undefined : (option) => (option.kind === 'practice' ? 'Practices' : 'Pages')}
      loading={loading && practices.length === 0}
      loadingText="Searching…"
      noOptionsText={`Nothing matches “${query}”. Try part of the name.`}
      disableClearable
      forcePopupIcon={false}
      fullWidth
      renderOption={({ key, ...props }, option) => {
        const Icon = option.icon;
        return (
          <Box component="li" key={key} {...props} sx={{ gap: 1.5, '&&': { minHeight: 44 } }}>
            {Icon ? (
              <Avatar
                sx={(theme) => ({ width: 28, height: 28, bgcolor: theme.tokens.shell.well, color: 'text.secondary' })}
              >
                <Icon sx={{ fontSize: 16 }} />
              </Avatar>
            ) : (
              <Avatar
                sx={(theme) => ({
                  width: 28,
                  height: 28,
                  fontSize: 11,
                  fontWeight: 600,
                  bgcolor: theme.tokens.shell.accentSoft,
                  color: theme.tokens.shell.accentInk,
                })}
              >
                {initials(option.label, option.label.split(' ')[1] ?? '')}
              </Avatar>
            )}
            <Typography component="span" variant="body2" sx={{ fontWeight: 500, flex: 1, minWidth: 0 }} noWrap>
              {option.label}
            </Typography>
            {option.sub && (
              <Typography component="span" variant="caption" noWrap sx={{ maxWidth: '45%' }}>
                {option.sub}
              </Typography>
            )}
          </Box>
        );
      }}
      slotProps={{
        paper: {
          sx: (theme) => ({
            mt: 1,
            borderRadius: `${theme.tokens.radius.tile}px`,
            border: `1px solid ${theme.tokens.shell.panelBorder}`,
            boxShadow: theme.tokens.shadow.menu,
            '& .MuiAutocomplete-option': { borderRadius: `${theme.tokens.radius.pill}px`, mx: 1 },
            '& .MuiAutocomplete-groupLabel': { fontSize: 12, lineHeight: 2.5, color: theme.tokens.shell.inkMuted },
          }),
        },
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          inputRef={inputRef}
          placeholder={jump ? 'Jump straight to a practice…' : 'Search practices, ODS code or town…'}
          slotProps={{
            ...params.slotProps,
            htmlInput: { ...params.slotProps.htmlInput, 'aria-label': label },
            input: {
              ...params.slotProps.input,
              startAdornment: (
                <Search sx={(theme) => ({ color: theme.tokens.shell.inkMuted, fontSize: jump ? 20 : 18 })} />
              ),
              endAdornment: (
                <Box
                  component="kbd"
                  aria-hidden
                  sx={(theme) => ({
                    display: { xs: 'none', sm: 'inline-block' },
                    font: 'inherit',
                    fontSize: 12,
                    px: 1,
                    color: theme.tokens.shell.inkMuted,
                    bgcolor: 'background.paper',
                    border: `1px solid ${theme.tokens.shell.line}`,
                    borderRadius: `${theme.tokens.radius.pill}px`,
                  })}
                >
                  {jump ? '/' : '⌘K'}
                </Box>
              ),
            },
          }}
          sx={(theme) => ({
            '& .MuiOutlinedInput-root': {
              gap: 1.25,
              height: jump ? 60 : 46,
              pl: jump ? 2.5 : 2.25,
              pr: 1,
              borderRadius: `${theme.tokens.radius.pill}px`,
              bgcolor: jump ? 'background.paper' : theme.tokens.shell.well,
              fontSize: jump ? 15.5 : 14,
              '& fieldset': { borderColor: jump ? theme.tokens.shell.line : 'transparent' },
              '&:hover fieldset': { borderColor: theme.tokens.shell.line },
              '&.Mui-focused': { bgcolor: 'background.paper', boxShadow: `0 0 0 3px ${theme.tokens.shell.focusRing}` },
              '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main, borderWidth: 1 },
            },
            '& .MuiAutocomplete-input::placeholder': { color: theme.tokens.shell.placeholder, opacity: 1 },
          })}
        />
      )}
    />
  );
}
