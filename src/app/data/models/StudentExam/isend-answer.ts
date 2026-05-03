export interface IsendAnswer {
  examId: number;
  studentExamId: string;
  questionId: number;
  selectedOptionId: number;
  eassayAnswer: string;
  serverResponses: number;
  sessionId: number;
  studentSession?: boolean;
}
/*{
  "examId": 0,
  "studentExamId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "questionId": 0,
  "selectedOptionId": 0,
  "eassayAnswer": "string",
  "serverResponses": 0,
  "sessionId": 0,
  "studentSession": true
}*/