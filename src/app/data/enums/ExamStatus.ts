export enum ExamStatus {
  NotStarted = 0, // غائب
  InProgress = 1, // جاري الامتحان
  Completed = 2, // تم ارسال الامتحان
  Flushed = 3, // جاري التصحيح
  PendingEassysManualGrading = 4, // تم الانتهاء من الامتحان و ينتظر تصحيح المقالى
  AllGraded = 5, // تم الانتهاء من تصحيح جميع الاسئلة الامتحانية
}
