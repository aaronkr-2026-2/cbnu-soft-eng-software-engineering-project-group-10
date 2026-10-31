// Date-only report fields must not shift a calendar day with timezone conversion.
export function formatDate(date: string) {
  const parsed = new Date(date.slice(0, 10) + 'T12:00:00');
  return Number.isNaN(parsed.getTime())
    ? date
    : parsed.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
}
export function formatFullDate(date: string) {
  const parsed = new Date(date.slice(0, 10) + 'T12:00:00');
  return Number.isNaN(parsed.getTime())
    ? date
    : parsed.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
}
