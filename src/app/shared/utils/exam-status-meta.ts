import { ExamStatus } from '../../data/enums/ExamStatus';

export interface ExamStatusMeta {
  label: string;
  icon: string;
  colorClass: string;
  borderColor: string;
}
export const EXAM_STATUS_MAP: Record<ExamStatus, ExamStatusMeta> = {
  [ExamStatus.NotStarted]: {
    label: 'Absent',
    icon: 'bi-dash-circle',
    colorClass: 'status-absent', 
    borderColor: 'border-absent',
  },
  [ExamStatus.InProgress]: {
    label: 'In Progress',
    icon: 'bi-play-circle',
    colorClass: 'status-progress',
    borderColor: 'border-progress',
  },
  [ExamStatus.Completed]: {
    label: 'Submitted',
    icon: 'bi-check-circle',
    colorClass: 'status-submitted',
    borderColor: 'border-submitted',
  },
  [ExamStatus.Flushed]: {
    label: 'Evaluating',
    icon: 'bi-gear-wide-connected',
    colorClass: 'status-evaluating',
    borderColor: 'border-evaluating',
  },
  [ExamStatus.PendingEassysManualGrading]: {
    label: 'Pending Review',
    icon: 'bi-hourglass-split',
    colorClass: 'status-pending',
    borderColor: 'border-pending',
  },
  [ExamStatus.AllGraded]: {
    label: 'Completed',
    icon: 'bi-trophy',
    colorClass: 'status-completed',
    borderColor: 'border-completed',
  },
};

export function getExamStatusMeta(status: ExamStatus): ExamStatusMeta {
  return (
    EXAM_STATUS_MAP[status] || {
      label: 'Unknown',
      icon: 'bi-question-circle',
      colorClass: 'status-neutral',
      borderColor: 'border-neutral',
    }
  );
}
