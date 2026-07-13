const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatTime(d: Date): string {
  const minutes = d.getMinutes() === 0 ? "00" : String(d.getMinutes()).padStart(2, "0");
  const hours24 = d.getHours();
  if (hours24 > 12) return `${hours24 - 12}:${minutes} PM`;
  if (hours24 === 12) return `12:${minutes} PM`;
  return `${hours24}:${minutes} AM`;
}

export function formatEventListDate(iso: string): { label: string; time: string } {
  const d = new Date(iso);
  return { label: `${MONTH_ABBR[d.getMonth()]} ${d.getDate()}`, time: formatTime(d) };
}

export function formatEventFullDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()} ${formatTime(d)}`;
}
