import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ImageAsset } from '../models/api.models';
import { API_BASE_URL } from './api.config';
import { normalizeImageAsset } from './image-url.util';

@Injectable({ providedIn: 'root' })
export class ImageService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  getAll(): Observable<ImageAsset[]> {
    return this.http.get<ImageAsset[]>(`${this.apiBaseUrl}/images`).pipe(
      map((images) => images.map((image) => normalizeImageAsset(image, this.apiBaseUrl))),
    );
  }

  upload(file: File): Observable<ImageAsset> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ImageAsset>(`${this.apiBaseUrl}/images`, formData).pipe(
      map((image) => normalizeImageAsset(image, this.apiBaseUrl)),
    );
  }
}