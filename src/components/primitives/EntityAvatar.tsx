import Avatar from '@mui/material/Avatar';
import type { SxProps, Theme } from '@mui/material/styles';
import { asset } from '@/lib/basePath';

export interface EntityAvatarProps {
  name: string;
  logoSrc?: string | null;
  size?: number;
  borderRadius?: number | string;
  /** Adds a thin border, as on framed logos in the practice profile. */
  framed?: boolean;
  sx?: SxProps<Theme>;
}

/** Two-letter initials: "Ashcroft Surgery" → "AS", "Riverside" → "RI". */
export function entityInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

/** Practice logo, or initials on a light-teal circle when there's no logo (COMPONENTS.md → EntityAvatar). */
export function EntityAvatar({
  name,
  logoSrc,
  size = 44,
  borderRadius = '50%',
  framed = false,
  sx,
}: EntityAvatarProps) {
  const src = logoSrc ? (logoSrc.startsWith('http') ? logoSrc : asset(logoSrc)) : undefined;
  return (
    <Avatar
      src={src}
      alt={name}
      sx={[
        (theme) => ({
          width: size,
          height: size,
          borderRadius,
          bgcolor: src ? 'background.paper' : theme.tokens.surface.tealLight,
          color: 'text.primary',
          fontWeight: 700,
          fontSize: size * 0.34,
          border: framed ? `1px solid ${theme.tokens.border.medium}` : undefined,
          '& img': { objectFit: 'contain' },
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {entityInitials(name)}
    </Avatar>
  );
}
