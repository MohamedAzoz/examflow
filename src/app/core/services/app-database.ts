import { Injectable } from '@angular/core';
import Dexie from 'dexie';

@Injectable({
  providedIn: 'root',
})
export class AppDatabase extends Dexie {
  constructor() {
    super('ExamFlowDB');
    this.version(1).stores({
      examAnswers: '++id, questionId, answer',
    });
  }

  async saveExamAnswer(answer: any): Promise<void> {
    await this.table('examAnswers').put(answer);
  }

  async getExamAnswer(questionId: number): Promise<any> {
    return this.table('examAnswers').get({ questionId });
  }

  async getAllExamAnswers(): Promise<any[]> {
    return this.table('examAnswers').toArray();
  }

  async deleteExamAnswer(questionId: number): Promise<void> {
    await this.table('examAnswers').delete(questionId);
  }

  async clearExamAnswers(): Promise<void> {
    await this.table('examAnswers').clear();
  }
}
