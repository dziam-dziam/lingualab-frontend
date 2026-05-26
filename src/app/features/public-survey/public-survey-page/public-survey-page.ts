import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ResponseService } from '../../../core/api/response.service';
import { SurveyService } from '../../../core/api/survey.service';
import { AnswerRequest, Survey } from '../../../core/models/api.models';
import { QuestionRendererComponent } from '../../../shared/components/question-renderer-component/question-renderer-component';

@Component({
  selector: 'app-public-survey-page',
  imports: [MatButtonModule, MatIconModule, QuestionRendererComponent],
  templateUrl: './public-survey-page.html',
  styleUrl: './public-survey-page.css',
})
export class PublicSurveyPage {
  private readonly route = inject(ActivatedRoute);
  private readonly surveyService = inject(SurveyService);
  private readonly responseService = inject(ResponseService);

  readonly survey = signal<Survey | null>(null);
  readonly currentIndex = signal(0);
  readonly answers = signal<AnswerRequest[]>([]);
  readonly complete = signal(false);
  readonly error = signal('');

  get publicId(): string {
    return this.route.snapshot.paramMap.get('publicId') ?? '';
  }

  constructor() {
    this.surveyService.getPublic(this.publicId).subscribe({
      next: (survey) => this.survey.set(survey),
      error: () => this.error.set('Survey is unavailable.'),
    });
  }

  updateAnswer(answer: AnswerRequest): void {
    this.answers.set([
      ...this.answers().filter((item) => item.questionId !== answer.questionId),
      answer,
    ]);
  }

  next(): void {
    if (!this.survey()) return;
    if (this.currentIndex() < this.survey()!.questions.length - 1) {
      this.currentIndex.update((index) => index + 1);
      return;
    }
    this.submit();
  }

  previous(): void {
    this.currentIndex.update((index) => Math.max(0, index - 1));
  }

  submit(): void {
    this.responseService.submitPublic(this.publicId, {
      userAgent: navigator.userAgent,
      answers: this.answers(),
    }).subscribe({
      next: () => this.complete.set(true),
      error: () => this.error.set('Could not submit responses.'),
    });
  }
}
