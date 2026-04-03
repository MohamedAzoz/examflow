import { ExamStatus } from '../../data/enums/ExamStatus';

export interface ExamStatusMeta {
  label: string;
  icon: string;
  colorClass: string;
  borderColor: string;
}
/*
.not-started {
  background-color: #f3f4f6;
  border: 1px solid #e5e7eb;
}
.not-started .exam-status {
  background-color: #e5e7eb;
  color: #4b5563;
}

.completed {
  background-color: #f0fdf4;
  border: 1px solid #dcfce7;
}
.completed .exam-status {
  background-color: #dcfce7;
  color: #16a34a;
}

.flushed {
  background-color: #fffbeb;
  border: 1px solid #fef3c7;
}
.flushed .exam-status {
  background-color: #fef3c7;
  color: #d97706;
}

.pending {
  background-color: #f5f3ff;
  border: 1px solid #ede9fe;
}
.pending .exam-status {
  background-color: #ede9fe;
  color: #7c3aed;
}

.all-graded {
  background-color: #f0fdfa;
  border: 1px solid #ccfbf1;
}
.all-graded .exam-status {
  background-color: #ccfbf1;
  color: #0d9488;
}
 */
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
