import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';

import { AuthTokenService } from '../../../core/api/auth-token.service';
import { ResponseService } from '../../../core/api/response.service';
import { SurveyService } from '../../../core/api/survey.service';
import { SubmissionResponse, Survey } from '../../../core/models/api.models';
import { NavigationComponent } from '../../../shared/components/navigation-component/navigation-component';

@Component({
  selector: 'app-results-page',
  imports: [RouterLink, MatButtonModule, MatIconModule, MatTableModule, NavigationComponent],
  templateUrl: './results-page.html',
  styleUrl: './results-page.css',
})
export class ResultsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly surveyService = inject(SurveyService);
  private readonly responseService = inject(ResponseService);
  private readonly authToken = inject(AuthTokenService);

  readonly survey = signal<Survey | null>(null);
  readonly submissions = signal<SubmissionResponse[]>([]);
  readonly error = signal('');
  readonly displayedColumns = ['session', 'completedAt', 'answers', 'meanReaction'];

  get surveyId(): string {
    return this.route.snapshot.paramMap.get('surveyId') ?? '';
  }

  constructor() {
    this.surveyService.getById(this.surveyId).subscribe({
      next: (survey) => this.survey.set(survey),
      error: () => this.error.set('Could not load survey.'),
    });
    this.responseService.getResponses(this.surveyId).subscribe({
      next: (submissions) => this.submissions.set(submissions),
      error: () => this.error.set('Could not load responses.'),
    });
  }

  meanReaction(submission: SubmissionResponse): string {
    const values = submission.answers
      .map((answer) => answer.reactionTimeMs)
      .filter((value): value is number => typeof value === 'number');
    if (!values.length) return '-';
    return `${Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)} ms`;
  }

  downloadCsv(): void {
    const token = this.authToken.token();
    fetch(this.responseService.getExportUrl(this.surveyId), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((response) => response.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'lingualab-results.csv';
        anchor.click();
        URL.revokeObjectURL(url);
      });
  }
}
