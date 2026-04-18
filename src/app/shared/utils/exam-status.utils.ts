export function normalizeExamStatus(status: string | null | undefined): string {
  return (status ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
}

export function isDraftExamStatus(status: string | null | undefined): boolean {
  const normalized = normalizeExamStatus(status);
  return normalized === 'draft' || normalized === '0';
}

export function getExamStatusBadgeClass(status: string | null | undefined): string {
  const normalized = normalizeExamStatus(status);

  if (normalized === 'published') {
    return 'bg-emerald-100 text-emerald-700';
  }

  if (normalized === 'completed' || normalized === 'allgraded') {
    return 'bg-sky-100 text-sky-700';
  }

  if (normalized === 'pendingmanualgrading') {
    return 'bg-amber-100 text-amber-700';
  }

  return 'bg-slate-100 text-slate-600';
}
