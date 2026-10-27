import Box, { type BoxProps } from '@mui/material/Box';
import { asset } from '@/lib/basePath';

export interface BrandLogoProps {
  src?: string;
  /** Rendered height in px; width follows the image's aspect ratio unless `width` is set. */
  height?: number;
  width?: number;
  alt?: string;
  sx?: BoxProps['sx'];
}

/** Aqlios wordmark (COMPONENTS.md → BrandLogo). */
export function BrandLogo({ src = '/aqlios_logo.svg', height = 32, width, alt = 'Aqlios', sx }: BrandLogoProps) {
  return (
    <Box
      component="img"
      src={asset(src)}
      alt={alt}
      sx={[{ height, width: width ?? 'auto', display: 'block' }, ...(Array.isArray(sx) ? sx : [sx])]}
    />
  );
}
