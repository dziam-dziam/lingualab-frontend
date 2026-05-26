import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ImageAsset } from '../models/api.models';
import { API_BASE_URL } from './api.config';

@Injectable({ providedIn: 'root' })
export class ImageService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  getAll(): Observable<ImageAsset[]> {
    return this.http.get<ImageAsset[]>(`${this.apiBaseUrl}/images`);
  }

  upload(file: File): Observable<ImageAsset> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ImageAsset>(`${this.apiBaseUrl}/images`, formData);
  }
}
