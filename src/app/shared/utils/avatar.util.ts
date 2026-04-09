const AVATAR_COLORS = ['#E0E7FF', '#FFEDD5', '#F3E8FF', '#CCFBF1', '#FCE7F3'] as const;

export function getInitials(fullName: string): string {
  return fullName
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');
}
// this function return the color of the avatar index
export function getAvatarColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}
const AVATAR_TEXT = ['#4F46E5', '#EA580C', '#9333EA', '#0D9488', '#DB2777'] as const;
// I want to return the color of the avatar by cycle of the index
export function getAvatarText(index: number): string {
  return AVATAR_TEXT[index % AVATAR_TEXT.length];
}

const JOBE_COLOR = [`#DBEAFE`, `#DCFCE7`] as const;

export function getJobColor(index: number): string {
  return JOBE_COLOR[index % JOBE_COLOR.length];
}

const JOBE_TEXT = ['#1E40AF', `#166534`] as const;

export function getJobText(index: number): string {
  return JOBE_TEXT[index % JOBE_TEXT.length];
}
