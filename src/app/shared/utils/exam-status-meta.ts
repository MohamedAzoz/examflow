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
    icon: 'pi-minus-circle',
    colorClass: 'danger',
    borderColor: 'border-danger',
  },
  [ExamStatus.InProgress]: {
    label: 'In Progress',
    icon: 'pi-play-circle',
    colorClass: 'primary',
    borderColor: 'border-primary',
  },
  [ExamStatus.Completed]: {
    label: 'Submitted',
    icon: 'pi-check-circle',
    colorClass: 'border-teal',
    borderColor: 'border-border-teal',
  },
  [ExamStatus.Flushed]: {
    label: 'Evaluating',
    icon: 'pi-spin pi-spinner',
    colorClass: 'orange',
    borderColor: 'border-orange',
  },
  [ExamStatus.PendingEassysManualGrading]: {
    label: 'Pending Essays',
    icon: 'pi-hourglass',
    colorClass: 'purple-700',
    borderColor: 'border-purple-700',
  },
  [ExamStatus.AllGraded]: {
    label: 'Completed',
    icon: 'pi-verified',
    colorClass: 'success',
    borderColor: 'border-success',
  },
};

export function getExamStatusMeta(status: ExamStatus): ExamStatusMeta {
  return (
    EXAM_STATUS_MAP[status] || {
      label: 'Unknown',
      icon: 'pi-question-circle',
      colorClass: 'gray',
      borderColor: 'border-gray',
    }
  );
}
