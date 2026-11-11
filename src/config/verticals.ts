import BusinessCenterOutlined from '@mui/icons-material/BusinessCenterOutlined';
import LocalHospitalOutlined from '@mui/icons-material/LocalHospitalOutlined';
import MedicalServicesOutlined from '@mui/icons-material/MedicalServicesOutlined';

// Card order and labels as on the live /verticals page. Everyclinic is always shown disabled.
// Shared by the vertical picker and the account menu's "Working in" list.
export const VERTICALS = [
  {
    slug: 'public',
    label: 'Public Primary Care',
    description: 'NHS practices and primary care networks',
    icon: LocalHospitalOutlined,
    href: '/verticals/public/practices',
  },
  {
    slug: 'private',
    label: 'Private Business',
    description: 'Independent clinics and services',
    icon: BusinessCenterOutlined,
    href: '/verticals/private',
  },
  {
    slug: 'everyclinic',
    label: 'Everyclinic Business',
    description: 'Partner clinics on the Everyclinic network',
    icon: MedicalServicesOutlined,
    href: null,
  },
] as const;

export type VerticalSlug = (typeof VERTICALS)[number]['slug'];
