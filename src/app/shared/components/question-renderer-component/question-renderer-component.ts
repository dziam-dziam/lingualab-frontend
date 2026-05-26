import { NgClass } from '@angular/common';
import { Component, effect, input, OnDestroy, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AnswerRequest, Question } from '../../../core/models/api.models';

@Component({
  selector: 'app-question-renderer-component',
  imports: [FormsModule, NgClass, MatButtonToggleModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule],
  templateUrl: './question-renderer-component.html',
  styleUrl: './question-renderer-component.css',
})
export class QuestionRendererComponent {
  readonly question = input.required<Question>();
  readonly answerChanged = output<AnswerRequest>();

  readonly stimulusVisible = signal(false);
  readonly reactionOptionsVisible = signal(false);
  readonly waiting = signal(false);
  private stimulusStart = 0;
  private reactionTimerId: number | null = null;
  private activeReactionQuestionKey = '';
  textAnswer = '';
  selectedOption = '';

  constructor() {
    effect(() => {
      const question = this.question();
      const questionKey = `${question.id ?? question.displayOrder}-${question.type}`;

      if (question.type !== 'REACTION_TIME') {
        this.clearReactionTimer();
        this.activeReactionQuestionKey = '';
        this.waiting.set(false);
        this.stimulusVisible.set(false);
        this.reactionOptionsVisible.set(false);
        return;
      }

      if (this.activeReactionQuestionKey === questionKey) return;
      this.activeReactionQuestionKey = questionKey;
      this.startReactionTrial();
    });
  }

  ngOnDestroy(): void {
    this.clearReactionTimer();
  }

  private startReactionTrial(): void {
    this.clearReactionTimer();
    this.waiting.set(true);
    this.stimulusVisible.set(false);
    this.reactionOptionsVisible.set(false);
    this.reactionTimerId = window.setTimeout(() => {
      this.stimulusStart = performance.now();
      this.waiting.set(false);
      if (this.question().options.length > 0) {
        this.reactionOptionsVisible.set(true);
      } else {
        this.stimulusVisible.set(true);
      }
    }, this.question().delayMs ?? 800);
  }

  private clearReactionTimer(): void {
    if (this.reactionTimerId === null) return;
    window.clearTimeout(this.reactionTimerId);
    this.reactionTimerId = null;
  }

  emitText(): void {
    this.answerChanged.emit({
      questionId: this.question().id ?? '',
      answerText: this.textAnswer,
    });
  }

  emitOption(): void {
    this.answerChanged.emit({
      questionId: this.question().id ?? '',
      selectedOption: this.selectedOption,
    });
  }

  chooseReactionOption(value: string): void {
    this.selectedOption = value;
    this.answerChanged.emit({
      questionId: this.question().id ?? '',
      selectedOption: value,
      reactionTimeMs: Math.round(performance.now() - this.stimulusStart),
    });
    this.reactionOptionsVisible.set(false);
  }
}
