import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ResponseSubmitRequest, SubmissionResponse } from '../models/api.models';
import { API_BASE_URL } from './api.config';

@Injectable({ providedIn: 'root' })
export class ResponseService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  submitPublic(publicId: string, request: ResponseSubmitRequest): Observable<SubmissionResponse> {
    return this.http.post<SubmissionResponse>(`${this.apiBaseUrl}/responses/public/${publicId}`, request);
  }

  getResponses(surveyId: string): Observable<SubmissionResponse[]> {
    return this.http.get<SubmissionResponse[]>(`${this.apiBaseUrl}/responses/survey/${surveyId}`);
  }

  getExportUrl(surveyId: string): string {
    return `${this.apiBaseUrl}/responses/survey/${surveyId}/export`;
  }
}
