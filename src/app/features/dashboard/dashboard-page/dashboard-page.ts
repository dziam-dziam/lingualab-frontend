import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { SurveyService } from '../../../core/api/survey.service';
import { Survey } from '../../../core/models/api.models';
import { NavigationComponent } from '../../../shared/components/navigation-component/navigation-component';

@Component({
  selector: 'app-dashboard-page',
  imports: [FormsModule, RouterLink, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, NavigationComponent],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.css',
})
export class DashboardPage {
  private readonly surveyService = inject(SurveyService);
  private readonly router = inject(Router);

  readonly surveys = signal<Survey[]>([]);
  readonly loading = signal(false);
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
        this.error.set('Could not load surveys.');
        this.loading.set(false);
      },
    });
  }

  createSurvey(): void {
    if (!this.newSurvey.title.trim()) return;
    this.surveyService.create(this.newSurvey).subscribe({
      next: (survey) => this.router.navigate(['/builder', survey.id]),
      error: () => this.error.set('Could not create survey.'),
    });
  }
}
