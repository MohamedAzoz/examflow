const AVATAR_COLORS = [
  '#dbeafe',
  '#d1fae5',
  '#fce7f3',
  '#ede9fe',
  '#fef3c7',
  '#fee2e2',
  '#e0f2fe',
  '#f0fdf4',
] as const;

export function getInitials(fullName: string): string {
  return fullName
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');
}

export function getAvatarColor(fullName: string): string {
  const index = fullName.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}
