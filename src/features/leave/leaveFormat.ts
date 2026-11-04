import dayjs from 'dayjs';

export const LEAVE_MANAGEMENT_PATH = '/leave-management';
export const MY_LEAVE_PATH = '/leave-and-rota';

export const leaveDate = (date: string) => dayjs(date).format('DD/MM/YYYY');
