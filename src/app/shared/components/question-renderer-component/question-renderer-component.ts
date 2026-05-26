import { NgClass } from '@angular/common';
import { Component, HostListener, input, output, signal } from '@angular/core';
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
  readonly waiting = signal(false);
  private stimulusStart = 0;
  textAnswer = '';
  selectedOption = '';

  startReactionTrial(): void {
    this.waiting.set(true);
    this.stimulusVisible.set(false);
    window.setTimeout(() => {
      this.stimulusStart = performance.now();
      this.waiting.set(false);
      this.stimulusVisible.set(true);
    }, this.question().delayMs ?? 800);
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

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (this.question().type !== 'REACTION_TIME' || !this.stimulusVisible()) return;
    const allowedKeys = (this.question().allowedKeys ?? 'f,j')
      .split(',')
      .map((key) => key.trim().toLowerCase());
    if (!allowedKeys.includes(event.key.toLowerCase())) return;
    this.answerChanged.emit({
      questionId: this.question().id ?? '',
      pressedKey: event.key,
      reactionTimeMs: Math.round(performance.now() - this.stimulusStart),
    });
    this.stimulusVisible.set(false);
  }
}
