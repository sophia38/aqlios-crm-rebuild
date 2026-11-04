/** Hours between two HH:mm times on the same day (0 if the end is before the start). */
export function hoursBetweenTimes(start: string, end: string) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return Math.max(0, eh * 60 + em - (sh * 60 + sm)) / 60;
}
