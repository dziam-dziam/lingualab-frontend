import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Question, Survey, SurveyRequest } from '../models/api.models';
import { API_BASE_URL } from './api.config';
import { normalizeQuestionImages, normalizeSurveyImages } from './image-url.util';

@Injectable({ providedIn: 'root' })
export class SurveyService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  getAll(): Observable<Survey[]> {
    return this.http.get<Survey[]>(`${this.apiBaseUrl}/surveys`).pipe(
      map((surveys) => surveys.map((survey) => normalizeSurveyImages(survey, this.apiBaseUrl))),
    );
  }

  getById(surveyId: string): Observable<Survey> {
    return this.http.get<Survey>(`${this.apiBaseUrl}/surveys/${surveyId}`).pipe(
      map((survey) => normalizeSurveyImages(survey, this.apiBaseUrl)),
    );
  }

  getPublic(publicId: string): Observable<Survey> {
    return this.http.get<Survey>(`${this.apiBaseUrl}/surveys/public/${publicId}`).pipe(
      map((survey) => normalizeSurveyImages(survey, this.apiBaseUrl)),
    );
  }

  create(request: SurveyRequest): Observable<Survey> {
    return this.http.post<Survey>(`${this.apiBaseUrl}/surveys`, request).pipe(
      map((survey) => normalizeSurveyImages(survey, this.apiBaseUrl)),
    );
  }

  update(surveyId: string, request: SurveyRequest): Observable<Survey> {
    return this.http.put<Survey>(`${this.apiBaseUrl}/surveys/${surveyId}`, request).pipe(
      map((survey) => normalizeSurveyImages(survey, this.apiBaseUrl)),
    );
  }

  publish(surveyId: string): Observable<Survey> {
    return this.http.post<Survey>(`${this.apiBaseUrl}/surveys/${surveyId}/publish`, {}).pipe(
      map((survey) => normalizeSurveyImages(survey, this.apiBaseUrl)),
    );
  }

  deleteSurvey(surveyId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/surveys/${surveyId}`);
  }

  addQuestion(surveyId: string, question: Question): Observable<Question> {
    return this.http.post<Question>(`${this.apiBaseUrl}/questions/survey/${surveyId}`, question).pipe(
      map((created) => normalizeQuestionImages(created, this.apiBaseUrl)),
    );
  }

  updateQuestion(question: Question): Observable<Question> {
    return this.http.put<Question>(`${this.apiBaseUrl}/questions/${question.id}`, question).pipe(
      map((updated) => normalizeQuestionImages(updated, this.apiBaseUrl)),
    );
  }

  deleteQuestion(questionId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/questions/${questionId}`);
  }

  reorderQuestions(surveyId: string, questions: Question[]): Observable<Question[]> {
    return this.http.put<Question[]>(`${this.apiBaseUrl}/questions/survey/${surveyId}/order`, questions.map((question) => ({
      questionId: question.id,
      displayOrder: question.displayOrder,
    }))).pipe(
      map((updated) => updated.map((question) => normalizeQuestionImages(question, this.apiBaseUrl))),
    );
  }
}