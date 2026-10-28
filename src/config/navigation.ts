import type { SvgIconComponent } from '@mui/icons-material';
import AccessTimeOutlined from '@mui/icons-material/AccessTimeOutlined';
import AssignmentIndOutlined from '@mui/icons-material/AssignmentIndOutlined';
import BadgeOutlined from '@mui/icons-material/BadgeOutlined';
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined';
import ChatBubbleOutlineOutlined from '@mui/icons-material/ChatBubbleOutlineOutlined';
import ContactPhoneOutlined from '@mui/icons-material/ContactPhoneOutlined';
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined';
import EventAvailableOutlined from '@mui/icons-material/EventAvailableOutlined';
import EventNoteOutlined from '@mui/icons-material/EventNoteOutlined';
import FactCheckOutlined from '@mui/icons-material/FactCheckOutlined';
import FeedbackOutlined from '@mui/icons-material/FeedbackOutlined';
import ForumOutlined from '@mui/icons-material/ForumOutlined';
import GavelOutlined from '@mui/icons-material/GavelOutlined';
import GridViewOutlined from '@mui/icons-material/GridViewOutlined';
import HeadsetMicOutlined from '@mui/icons-material/HeadsetMicOutlined';
import HowToRegOutlined from '@mui/icons-material/HowToRegOutlined';
import InsertChartOutlined from '@mui/icons-material/InsertChartOutlined';
import LockOutlined from '@mui/icons-material/LockOutlined';
import MarkChatUnreadOutlined from '@mui/icons-material/MarkChatUnreadOutlined';
import NotificationsNoneOutlined from '@mui/icons-material/NotificationsNoneOutlined';
import PersonAddAltOutlined from '@mui/icons-material/PersonAddAltOutlined';
import PersonOutlineOutlined from '@mui/icons-material/PersonOutlineOutlined';
import PersonRemoveOutlined from '@mui/icons-material/PersonRemoveOutlined';
import PhoneCallbackOutlined from '@mui/icons-material/PhoneCallbackOutlined';
import PollOutlined from '@mui/icons-material/PollOutlined';
import QuizOutlined from '@mui/icons-material/QuizOutlined';
import ReceiptLongOutlined from '@mui/icons-material/ReceiptLongOutlined';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import TimerOutlined from '@mui/icons-material/TimerOutlined';
import TrendingUpOutlined from '@mui/icons-material/TrendingUpOutlined';
import VerifiedOutlined from '@mui/icons-material/VerifiedOutlined';
import WorkOutlineOutlined from '@mui/icons-material/WorkOutlineOutlined';
import ConfirmationNumberOutlined from '@mui/icons-material/ConfirmationNumberOutlined';
import FolderOpenOutlined from '@mui/icons-material/FolderOpenOutlined';
import type { AuthUser } from '@/lib/api/types';

// Menus from docs/super-admin/00-module-map.md and docs/practice/00-practice-shell-and-module-map.md.
// Icons are the closest MUI outlined icons to the live app's custom SVGs.

export type ModuleStatus = 'built' | 'placeholder' | 'coming-soon';

export interface NavItem {
  id: string;
  label: string;
  icon: SvgIconComponent;
  /** Path relative to the frame's base: the vertical (`/verticals/public`) or the practice. */
  path: string;
  /** Extra query string (Activity Tracker opens ROTA on its own tab). */
  query?: string;
  status: ModuleStatus;
  /** Who sees the item. Defaults to everyone. */
  audience?: 'admin' | 'practice-user';
  /** Hidden for practice users (captured: no HR Policies or Documents in their menu). */
  hiddenForPracticeUser?: boolean;
}

export interface NavSection {
  id: string;
  /** Section header; `null` renders the small "Overview" label instead. */
  title: string | null;
  items: NavItem[];
}

export const VERTICAL_NAV: NavSection[] = [
  {
    id: 'overview',
    title: null,
    items: [{ id: 'dashboard', label: 'Dashboard', icon: GridViewOutlined, path: '/practices', status: 'built' }],
  },
  {
    id: 'hub',
    title: 'HUB',
    items: [
      {
        id: 'practice-onboarding',
        label: 'Practice Onboarding',
        icon: PersonAddAltOutlined,
        path: '/hub-management/practices',
        status: 'built',
      },
      { id: 'templates', label: 'Template Library', icon: DescriptionOutlined, path: '/templates', status: 'built' },
      { id: 'roles', label: 'Role and Permissions', icon: LockOutlined, path: '/roles', status: 'built' },
      {
        id: 'leaves-management',
        label: 'Leaves Management',
        icon: AccessTimeOutlined,
        path: '/coming-soon/leaves-management',
        status: 'coming-soon',
      },
      { id: 'rota', label: 'ROTA Management', icon: CalendarMonthOutlined, path: '/rota', status: 'built' },
    ],
  },
  {
    id: 'comms',
    title: 'COMMS',
    items: [
      {
        id: 'notification-management',
        label: 'Notification Management',
        icon: ChatBubbleOutlineOutlined,
        path: '/coming-soon/notification-management',
        status: 'coming-soon',
      },
    ],
  },
  {
    id: 'analytics',
    title: 'ANALYTICS & REPORTING',
    items: [
      {
        id: 'reports',
        label: 'Reports',
        icon: InsertChartOutlined,
        path: '/coming-soon/reports',
        status: 'coming-soon',
      },
    ],
  },
  {
    id: 'compliance',
    title: 'COMPLIANCE',
    items: [
      {
        id: 'cqc-compliance',
        label: 'CQC Compliance',
        icon: VerifiedOutlined,
        path: '/compliance-dashboard',
        status: 'built',
      },
    ],
  },
  {
    id: 'finance',
    title: 'FINANCE',
    items: [
      {
        id: 'payroll',
        label: 'Payroll',
        icon: WorkOutlineOutlined,
        path: '/coming-soon/payroll',
        status: 'coming-soon',
      },
      {
        id: 'workforce-validation',
        label: 'Workforce Validation',
        icon: HowToRegOutlined,
        path: '/coming-soon/workforce-validation',
        status: 'coming-soon',
      },
    ],
  },
  {
    id: 'recruitment',
    title: 'RECRUITMENT',
    items: [
      {
        id: 'vacancy-management',
        label: 'Vacancy Management',
        icon: BadgeOutlined,
        path: '/coming-soon/vacancy-management',
        status: 'coming-soon',
      },
      {
        id: 'application-tracking',
        label: 'Application Tracking',
        icon: TimerOutlined,
        path: '/coming-soon/application-tracking',
        status: 'coming-soon',
      },
    ],
  },
  {
    id: 'support',
    title: 'SUPPORT',
    items: [
      {
        id: 'system-feed',
        label: 'System Feed',
        icon: HeadsetMicOutlined,
        path: '/system-feed',
        status: 'placeholder',
      },
    ],
  },
];

export const VERTICAL_FOOTER_NAV: NavItem[] = [
  {
    id: 'notifications',
    label: 'Notifications',
    icon: NotificationsNoneOutlined,
    path: '/notifications',
    status: 'placeholder',
  },
  { id: 'settings', label: 'Settings', icon: SettingsOutlined, path: '/settings', status: 'built' },
];

export const PRACTICE_NAV: NavSection[] = [
  {
    id: 'overview',
    title: null,
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: GridViewOutlined, path: '/dashboard', status: 'built' },
      {
        id: 'profile',
        label: 'Profile',
        icon: PersonOutlineOutlined,
        path: '/profile',
        status: 'built',
        audience: 'practice-user',
      },
    ],
  },
  {
    id: 'ehr',
    title: 'EHR',
    items: [
      { id: 'patients', label: 'Patients', icon: AssignmentIndOutlined, path: '/patient-management', status: 'built' },
      {
        id: 'tickets',
        label: 'Tickets',
        icon: ConfirmationNumberOutlined,
        path: '/consultations-review',
        status: 'built',
      },
      { id: 'appointment', label: 'Appointment', icon: EventNoteOutlined, path: '/appointment', status: 'built' },
      {
        id: 'documents',
        label: 'Documents',
        icon: FolderOpenOutlined,
        path: '/documents',
        status: 'placeholder',
        hiddenForPracticeUser: true,
      },
      {
        id: 'call-recall',
        label: 'Call Recall',
        icon: PhoneCallbackOutlined,
        path: '/coming-soon/call-recall',
        status: 'coming-soon',
      },
    ],
  },
  {
    id: 'hrm',
    title: 'HRM',
    items: [
      { id: 'staff', label: 'Staff on-boarding', icon: PersonAddAltOutlined, path: '/staff', status: 'built' },
      {
        id: 'staff-off-boarding',
        label: 'Staff off-boarding',
        icon: PersonRemoveOutlined,
        path: '/coming-soon/staff-off-boarding',
        status: 'coming-soon',
      },
      { id: 'rota', label: 'ROTA Management', icon: CalendarMonthOutlined, path: '/rota', status: 'built' },
      {
        id: 'activity-tracker',
        label: 'Activity Tracker',
        icon: TimerOutlined,
        path: '/rota',
        query: 'module=activityTracker',
        status: 'built',
      },
      { id: 'leaves', label: 'Leaves', icon: AccessTimeOutlined, path: '/leave-management', status: 'built' },
      {
        id: 'leaves-and-rota',
        label: 'Leaves and ROTA',
        icon: EventAvailableOutlined,
        path: '/leave-and-rota',
        status: 'built',
      },
      {
        id: 'hrm-compliance',
        label: 'Compliance',
        icon: ShieldOutlined,
        path: '/coming-soon/compliance',
        status: 'coming-soon',
      },
      { id: 'recruitment', label: 'Recruitment', icon: BadgeOutlined, path: '/recruitment', status: 'placeholder' },
      {
        id: 'performance',
        label: 'Performance',
        icon: TrendingUpOutlined,
        path: '/performance',
        status: 'placeholder',
      },
      {
        id: 'hr-policies',
        label: 'HR Policies',
        icon: GavelOutlined,
        path: '/hr-policies/ask',
        status: 'built',
        hiddenForPracticeUser: true,
      },
    ],
  },
  {
    id: 'comms',
    title: 'COMMS',
    items: [
      {
        id: 'patient-comms',
        label: 'Patient Comms',
        icon: ForumOutlined,
        path: '/coming-soon/patient-comms',
        status: 'coming-soon',
      },
      {
        id: 'colleagues-comms',
        label: 'Colleagues Comms',
        icon: MarkChatUnreadOutlined,
        path: '/coming-soon/colleagues-comms',
        status: 'coming-soon',
      },
      {
        id: 'notification-management',
        label: 'Notification Management',
        icon: NotificationsNoneOutlined,
        path: '/coming-soon/notification-management',
        status: 'coming-soon',
      },
    ],
  },
  {
    id: 'finance',
    title: 'FINANCE',
    items: [
      {
        id: 'payroll',
        label: 'Payroll',
        icon: ReceiptLongOutlined,
        path: '/coming-soon/payroll',
        status: 'coming-soon',
      },
      {
        id: 'workforce-validation',
        label: 'Workforce Validation',
        icon: HowToRegOutlined,
        path: '/coming-soon/workforce-validation',
        status: 'coming-soon',
      },
    ],
  },
  {
    id: 'compliance',
    title: 'COMPLIANCE',
    items: [
      {
        id: 'cqc-compliance',
        label: 'CQC Compliance',
        icon: FactCheckOutlined,
        path: '/coming-soon/cqc-compliance',
        status: 'coming-soon',
      },
    ],
  },
  {
    id: 'support',
    title: 'SUPPORT',
    items: [
      { id: 'survey', label: 'Survey', icon: PollOutlined, path: '/coming-soon/survey', status: 'coming-soon' },
      {
        id: 'feedback',
        label: 'Feedback',
        icon: FeedbackOutlined,
        path: '/coming-soon/feedback',
        status: 'coming-soon',
      },
      {
        id: 'colleague-survey',
        label: 'Colleague Survey',
        icon: QuizOutlined,
        path: '/coming-soon/colleague-survey',
        status: 'coming-soon',
      },
      { id: 'support', label: 'Support', icon: ContactPhoneOutlined, path: '/support', status: 'placeholder' },
    ],
  },
];

export const PRACTICE_FOOTER_NAV: NavItem[] = [
  {
    id: 'notifications',
    label: 'Notifications',
    icon: NotificationsNoneOutlined,
    path: '/notifications',
    status: 'placeholder',
  },
  { id: 'settings', label: 'Settings', icon: SettingsOutlined, path: '/settings', status: 'built' },
];

/** Removes items the user may not see (role-aware menus, one config). */
export function navForUser(sections: NavSection[], user: Pick<AuthUser, 'isAdmin'> | null): NavSection[] {
  const isPracticeUser = Boolean(user && !user.isAdmin);
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (item.audience === 'admin' && isPracticeUser) return false;
        if (item.audience === 'practice-user' && !isPracticeUser) return false;
        return !(isPracticeUser && item.hiddenForPracticeUser);
      }),
    }))
    .filter((section) => section.items.length > 0);
}

/** Every `coming-soon/{module}` route with its label and icon, for static generation and the placeholder page. */
export function comingSoonModules(sections: NavSection[]) {
  return sections
    .flatMap((section) => section.items)
    .filter((item) => item.status === 'coming-soon')
    .map((item) => ({ slug: item.path.replace('/coming-soon/', ''), label: item.label, icon: item.icon }));
}
