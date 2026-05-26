import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { SurveyService } from '../../../core/api/survey.service';
import { Survey } from '../../../core/models/api.models';
import { NavigationComponent } from '../../../shared/components/navigation-component/navigation-component';

@Component({
  selector: 'app-dashboard-page',
  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    NavigationComponent,
  ],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.css',
})
export class DashboardPage {
  private readonly surveyService = inject(SurveyService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly surveys = signal<Survey[]>([]);
  readonly loading = signal(false);
  readonly creating = signal(false);
  readonly deletingSurveyId = signal<string | null>(null);
  readonly error = signal('');

  newSurvey = {
    title: '',
    description: '',
  };

  constructor() {
    this.loadSurveys();
  }

  loadSurveys(): void {
    this.loading.set(true);
    this.surveyService.getAll().subscribe({
      next: (surveys) => {
        this.surveys.set(surveys);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.showError('Could not load surveys.');
      },
    });
  }

  createSurvey(): void {
    if (!this.newSurvey.title.trim()) return;
    this.creating.set(true);
    this.surveyService.create(this.newSurvey).subscribe({
      next: (survey) => {
        this.creating.set(false);
        this.showSuccess('Survey created.');
        this.router.navigate(['/builder', survey.id]);
      },
      error: () => {
        this.creating.set(false);
        this.showError('Could not create survey.');
      },
    });
  }

  deleteSurvey(survey: Survey): void {
    this.deletingSurveyId.set(survey.id);
    this.surveyService.deleteSurvey(survey.id).subscribe({
      next: () => {
        this.surveys.set(this.surveys().filter((item) => item.id !== survey.id));
        this.deletingSurveyId.set(null);
        this.showSuccess('Survey deleted.');
      },
      error: () => {
        this.deletingSurveyId.set(null);
        this.showError('Could not delete survey.');
      },
    });
  }

  private showSuccess(message: string): void {
    this.error.set('');
    this.snackBar.open(message, 'OK', { duration: 2600 });
  }

  private showError(message: string): void {
    this.error.set(message);
    this.snackBar.open(message, 'OK', { duration: 4200, panelClass: ['snackbar-error'] });
  }
}