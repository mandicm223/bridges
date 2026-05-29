export function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = Date.now();
  const diffMs = now - date.getTime();

  if (Number.isNaN(diffMs) || diffMs < 0) {
    return "just now";
  }

  const diffMinutes = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays}d ago`;
  }

  if (diffHours > 0) {
    return `${diffHours}h ago`;
  }

  if (diffMinutes > 0) {
    return `${diffMinutes}m ago`;
  }

  return "just now";
}
