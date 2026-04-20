

// tranfarm exam status to titlee.g. "Pending Essays Manual Grading" to "Pending Essays Manual Grading"
import { ProfessorExamStatus } from "../../data/enums/ProfessorExamStatus";

export function getExamStatusTitle(status:  ProfessorExamStatus): string {
  if ( status == ProfessorExamStatus.Draft ) {
   return 'Draft';
  }
  if ( status == ProfessorExamStatus.Published ) {
    return 'Published';
  }
  if ( status == ProfessorExamStatus.Completed ) {
    return 'Completed';
  }
  if ( status == ProfessorExamStatus.PendingManualGrading ) {
    return 'Pending Essays Manual Grading';
  }
  if ( status == ProfessorExamStatus.AllGraded ) {
    return 'All Graded';
  }

  return 'Unknown Status';
}
