import { ProfessorExamStatus } from '../../data/enums/ProfessorExamStatus';

export function normalizeExamStatus(status: string | number | null | undefined): string {
  if (typeof status === 'number') {
    return status.toString();
  }
  return (status ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
}

export function isDraftExamStatus(status: string | number | null | undefined): boolean {
  const normalized = normalizeExamStatus(status);
  return normalized === 'draft' || normalized === ProfessorExamStatus.Draft.toString();
}

export function isPublishedExamStatus(status: string | number | null | undefined): boolean {
  const normalized = normalizeExamStatus(status);
  return normalized === 'published' || normalized === ProfessorExamStatus.Published.toString();
}

export function isCompletedExamStatus(status: string | number | null | undefined): boolean {
  const normalized = normalizeExamStatus(status);
  return normalized === 'completed' || normalized === ProfessorExamStatus.Completed.toString();
}

export function isPendingGradingExamStatus(status: string | number | null | undefined): boolean {
  const normalized = normalizeExamStatus(status);
  return (
    normalized === 'pendingeassysmanualgrading' ||
    normalized === ProfessorExamStatus.PendingManualGrading.toString()
  );
} 

export function isAllGradedExamStatus(status: string | number | null | undefined): boolean {
  const normalized = normalizeExamStatus(status);
  return normalized === 'allgraded' || normalized === ProfessorExamStatus.AllGraded.toString();
}

export function getExamStatusBadgeClass(status: string | number | null | undefined): string {
  if (isPublishedExamStatus(status)) {
    return 'bg-emerald-100 text-emerald-700'; // Green
  }

  if (isAllGradedExamStatus(status)) {
    return 'bg-blue-100 text-blue-600'; // Blueish
  }

  if (isPendingGradingExamStatus(status)) {
    return 'bg-amber-100 text-amber-700'; // Orange/Amber
  }

  if (isCompletedExamStatus(status)) {
    return 'bg-slate-200 text-slate-700'; // Gray
  }
  
  if (isDraftExamStatus(status)) {
    return 'bg-slate-100 text-slate-600'; // Light Gray
  }

  return 'bg-slate-100 text-slate-600';
}
