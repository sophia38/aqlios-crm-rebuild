'use client';

import Link from 'next/link';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';

export interface SettingsSection {
  key: string;
  label: string;
}

export interface SettingsShellProps {
  sections: SettingsSection[];
  active: string;
  /** Link for a section, e.g. `?section=competency`. */
  hrefFor: (key: string) => string;
  /** Section title and subtitle at the top of the content card. */
  title: string;
  subtitle?: string;
  /** Regular weight for the title (live: Pathway Configuration). */
  children: React.ReactNode;
}

/**
 * Settings layout: left section nav and a white content card (COMPONENTS.md → SettingsShell,
 * docs/super-admin/09-settings.md). Below md the nav becomes a scrollable row of pills.
 */
export function SettingsShell({ sections, active, hrefFor, title, subtitle, children }: SettingsShellProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2.5, alignItems: 'flex-start' }}>
      <Box
        component="nav"
        aria-label="Settings sections"
        sx={(theme) => ({
          width: { xs: '100%', md: 230 },
          flexShrink: 0,
          bgcolor: 'background.paper',
          borderRadius: `${theme.tokens.radius.card}px`,
          border: `1px solid ${theme.tokens.border.medium}`,
          p: 1,
        })}
      >
        <Box
          component="ul"
          sx={{
            listStyle: 'none',
            m: 0,
            p: 0,
            display: 'flex',
            flexDirection: { xs: 'row', md: 'column' },
            gap: 0.5,
            overflowX: { xs: 'auto', md: 'visible' },
          }}
        >
          {sections.map((section) => {
            const selected = section.key === active;
            return (
              <Box component="li" key={section.key} sx={{ flexShrink: 0 }}>
                <ButtonBase
                  component={Link}
                  href={hrefFor(section.key)}
                  aria-current={selected ? 'page' : undefined}
                  sx={(theme) => ({
                    width: '100%',
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    px: 2,
                    py: 1.25,
                    borderRadius: `${theme.tokens.radius.pill}px`,
                    fontSize: 14,
                    whiteSpace: { xs: 'nowrap', md: 'normal' },
                    fontWeight: selected ? 600 : 400,
                    color: selected ? 'text.primary' : 'text.secondary',
                    border: `1px solid ${selected ? theme.tokens.border.bold : 'transparent'}`,
                    bgcolor: selected ? theme.tokens.surface.subtleFill : 'transparent',
                    '&:hover': { bgcolor: theme.tokens.surface.tealLight },
                    '&.Mui-focusVisible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 1 },
                  })}
                >
                  {section.label}
                </ButtonBase>
              </Box>
            );
          })}
        </Box>
      </Box>
      <Box
        component="section"
        aria-labelledby="settings-section-title"
        sx={(theme) => ({
          flex: 1,
          minWidth: 0,
          width: '100%',
          bgcolor: 'background.paper',
          borderRadius: `${theme.tokens.radius.card}px`,
          border: `1px solid ${theme.tokens.border.medium}`,
          p: { xs: 2, md: 3 },
        })}
      >
        <Typography id="settings-section-title" component="h2" variant="sectionTitle">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
        <Box sx={{ mt: 2.5 }}>{children}</Box>
      </Box>
    </Box>
  );
}
