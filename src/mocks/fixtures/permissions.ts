import type { Permission } from '@/lib/api/types';
import { mockId } from './random';

// The Public Primary Care permission catalog as captured: 103 permissions in 18 modules
// (docs/super-admin/05-roles-and-permissions.md → "Permission catalog"). Nesting is the indent seen on screen.

interface Node {
  label: string;
  children?: Node[];
}

const leaf = (...labels: string[]): Node[] => labels.map((label) => ({ label }));
const viewManage = (thing: string): Node => ({ label: `View ${thing}`, children: leaf(`Manage ${thing}`) });

const CATALOG: [string, Node[]][] = [
  ['Activity Tracker', leaf('View Activity Tracker')],
  [
    'Appointment',
    [
      {
        label: 'View Alternative Appointment Approval Requests',
        children: leaf('Approve/Reject Alternative Appointment Requests'),
      },
      { label: 'View Appointments List/Calendar View', children: leaf('Schedule/Request Follow-up') },
      {
        label: 'View Appointment Detail',
        children: leaf('Join and Complete Appointments', 'Reschedule and Cancel Appointments'),
      },
      {
        label: 'View Open/Available and Booked Slots',
        children: [
          { label: 'Book Appointments for Patients', children: leaf('Book Slots for Other Staff') },
          ...leaf('Open Slots for Patients', 'Request Slots for Other Staff'),
        ],
      },
    ],
  ],
  ['Billing', leaf('Billing')],
  ['Dashboard', leaf('View All Insights')],
  ['Exit Interview Management', [viewManage('Exit Interviews')]],
  ['HR Analytics', leaf('View Analytics')],
  ['HR Policies', [viewManage('Policies')]],
  [
    'Leave Management',
    leaf(
      'Apply for Leave',
      'Approve/Reject Leaves',
      'View Leave Balance Summary',
      'View Leaves Requests',
      'View Staff Leave History',
    ),
  ],
  ['Org Chart Management', [viewManage('Org Chart')]],
  [
    'Patient Consultation Requests',
    [
      {
        label: 'Access All Inboxes',
        children: leaf(
          'Assign/Reassign Requests',
          'Change Status',
          'Chat with Patient',
          'Close/Reopen Requests',
          'Copy into Clinical System',
          'Fetch/View Medical History',
          'Fetch from Clinical System',
          'Forward a Case',
          'Mark Urgent/Routine',
          'Open in Clinical System',
          'Prescribe Medicine',
          'Request a Test',
          'Request Documents/Info',
          'View/Add/Delete Clinical Notes',
          'View/Add/Edit/Delete Snomed Codes',
        ),
      },
    ],
  ],
  [
    'Patients',
    [
      {
        label: 'View List of Patients',
        children: [
          ...leaf('Archive/Unarchive Patients', 'Send/Resend Invites'),
          {
            label: 'View Patient Details',
            children: [{ label: 'View List of Requests', children: leaf('View Request Details') }],
          },
        ],
      },
    ],
  ],
  [
    'Performance Management',
    [
      ...leaf('Manage Configuration'),
      viewManage('360 Feedback'),
      viewManage('Bonus Points'),
      viewManage('Key Results'),
      viewManage('Meetings'),
      viewManage('Objectives'),
    ],
  ],
  [
    'Recruitment Management',
    [
      ...leaf('Approve Requisitions', 'Manage Configuration', 'Request Job Openings'),
      viewManage('Candidates'),
      viewManage('Interviews'),
      viewManage('Job Openings'),
    ],
  ],
  [
    'Role Permission Management',
    [
      ...leaf('Assign/Reassign Roles of User'),
      {
        label: 'List All Roles',
        children: leaf('View Associated Users to a Role', 'View Permissions for a Role'),
      },
    ],
  ],
  [
    'ROTA Management',
    [
      {
        label: 'Access Practice and Staff View',
        children: leaf(
          'Create and Apply ROTA Template',
          'Create ROTA Assignment',
          'Download ROTA',
          'Edit and Delete ROTA Assignment',
          'Reassign Staff or Practice',
        ),
      },
      {
        label: 'View List of ROTA Groups',
        children: leaf('Add/Edit/Assign ROTA Groups', 'Publish Slot, Accept or Reject Bidding'),
      },
      ...leaf('Bid for a ROTA Slot'),
    ],
  ],
  [
    'Settings',
    [
      { label: 'View Appointment Configurations', children: leaf('Edit Appointment Configurations') },
      ...leaf('View Roles and Permissions'),
      {
        label: 'View Standard and Staff-created Templates',
        children: leaf(
          'Add/Edit Staff-created Templates',
          'Add/Edit Standard Templates',
          'Delete Staff-created Templates',
          'Delete Standard Templates',
          'Move Staff-created Templates to Standard',
        ),
      },
    ],
  ],
  ['Skills Management', [viewManage('Skills')]],
  [
    'Staff Management',
    [
      {
        label: 'View Staff List',
        children: [
          ...leaf('Approve/Reject User', 'Archive/Unarchive Staff', 'Lock/Unlock Staff', 'Send/Resend Invite'),
          {
            label: 'View Staff Details',
            children: leaf(
              'Update Contract, Operating Hours and Leave Entitlement',
              'Update Staff Details',
              'Verify/Approve/Reject/Download Compliance Documents',
            ),
          },
        ],
      },
    ],
  ],
];

export function buildPermissionCatalog(): Permission[] {
  const permissions: Permission[] = [];
  const walk = (module: string, nodes: Node[], parent: Permission | null) => {
    for (const node of nodes) {
      const name = `${parent ? parent.name : module}:${node.label}`;
      const permission: Permission = {
        id: mockId('permission', permissions.length),
        name,
        description: node.label,
        module,
        parent: parent?.id ?? null,
      };
      permissions.push(permission);
      walk(module, node.children ?? [], permission);
    }
  };
  for (const [module, nodes] of CATALOG) walk(module, nodes, null);
  return permissions;
}

/** Starting permissions per role name. Nurse matches the capture; the others are plausible sets. */
export function defaultRolePermissions(roleName: string, catalog: Permission[]): string[] {
  const inModules = (...modules: string[]) =>
    catalog.filter((permission) => modules.includes(permission.module)).map((permission) => permission.id);
  switch (roleName) {
    case 'Nurse':
      return catalog
        .filter(
          (permission) =>
            permission.module === 'Role Permission Management' &&
            permission.description !== 'View Associated Users to a Role',
        )
        .map((permission) => permission.id);
    case 'HR':
      return inModules(
        'HR Analytics',
        'HR Policies',
        'Leave Management',
        'Org Chart Management',
        'Exit Interview Management',
        'Recruitment Management',
        'Staff Management',
      );
    case 'Care navigator':
      return inModules('Patients', 'Patient Consultation Requests', 'Appointment').slice(0, 14);
    case 'Practice Manager':
      return catalog.filter((permission) => permission.module !== 'Billing').map((permission) => permission.id);
    case 'Clinician':
      return inModules('Appointment', 'Patients', 'Patient Consultation Requests', 'Leave Management', 'Dashboard');
    default:
      return [];
  }
}
