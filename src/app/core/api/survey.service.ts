import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Question, Survey, SurveyRequest } from '../models/api.models';
import { API_BASE_URL } from './api.config';

@Injectable({ providedIn: 'root' })
export class SurveyService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  getAll(): Observable<Survey[]> {
    return this.http.get<Survey[]>(`${this.apiBaseUrl}/surveys`);
  }

  getById(surveyId: string): Observable<Survey> {
    return this.http.get<Survey>(`${this.apiBaseUrl}/surveys/${surveyId}`);
  }

  getPublic(publicId: string): Observable<Survey> {
    return this.http.get<Survey>(`${this.apiBaseUrl}/surveys/public/${publicId}`);
  }

  create(request: SurveyRequest): Observable<Survey> {
    return this.http.post<Survey>(`${this.apiBaseUrl}/surveys`, request);
  }

  update(surveyId: string, request: SurveyRequest): Observable<Survey> {
    return this.http.put<Survey>(`${this.apiBaseUrl}/surveys/${surveyId}`, request);
  }

  publish(surveyId: string): Observable<Survey> {
    return this.http.post<Survey>(`${this.apiBaseUrl}/surveys/${surveyId}/publish`, {});
  }

  addQuestion(surveyId: string, question: Question): Observable<Question> {
    return this.http.post<Question>(`${this.apiBaseUrl}/questions/survey/${surveyId}`, question);
  }

  updateQuestion(question: Question): Observable<Question> {
    return this.http.put<Question>(`${this.apiBaseUrl}/questions/${question.id}`, question);
  }

  reorderQuestions(surveyId: string, questions: Question[]): Observable<Question[]> {
    return this.http.put<Question[]>(`${this.apiBaseUrl}/questions/survey/${surveyId}/order`, questions.map((question) => ({
      questionId: question.id,
      displayOrder: question.displayOrder,
    })));
  }
}
