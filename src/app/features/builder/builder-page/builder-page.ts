import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { ImageService } from '../../../core/api/image.service';
import { SurveyService } from '../../../core/api/survey.service';
import { ImageAsset, Question, QuestionType, Survey } from '../../../core/models/api.models';
import { NavigationComponent } from '../../../shared/components/navigation-component/navigation-component';
import { ImageQuestionDialog } from '../image-question-dialog/image-question-dialog';

interface BuilderBlock {
  type: QuestionType;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-builder-page',
  imports: [
    CdkDrag,
    CdkDropList,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    NavigationComponent,
  ],
  templateUrl: './builder-page.html',
  styleUrl: './builder-page.css',
})
export class BuilderPage {
  private readonly route = inject(ActivatedRoute);
  private readonly surveyService = inject(SurveyService);
  private readonly imageService = inject(ImageService);
  private readonly dialog = inject(MatDialog);

  readonly survey = signal<Survey | null>(null);
  readonly questions = signal<Question[]>([]);
  readonly images = signal<ImageAsset[]>([]);
  readonly error = signal('');
  readonly copied = signal(false);

  selectedQuestion: Question | null = null;

  readonly blocks: BuilderBlock[] = [
    { type: 'TEXT', label: 'Text Question', icon: 'short_text' },
    { type: 'MULTIPLE_CHOICE', label: 'Multiple Choice', icon: 'radio_button_checked' },
    { type: 'IMAGE', label: 'Image Question', icon: 'image' },
    { type: 'REACTION_TIME', label: 'Reaction Time', icon: 'timer' },
  ];

  get surveyId(): string {
    return this.route.snapshot.paramMap.get('surveyId') ?? '';
  }

  constructor() {
    this.loadSurvey();
    this.loadImages();
  }

  loadSurvey(): void {
    this.surveyService.getById(this.surveyId).subscribe({
      next: (survey) => {
        this.survey.set(survey);
        this.questions.set([...survey.questions]);
      },
      error: () => this.error.set('Could not load study.'),
    });
  }

  loadImages(): void {
    this.imageService.getAll().subscribe({
      next: (images) => this.images.set(images),
      error: () => this.error.set('Could not load image library.'),
    });
  }

  drop(event: CdkDragDrop<Question[], BuilderBlock[] | Question[]>): void {
    if (event.previousContainer === event.container) {
      const reordered = [...this.questions()];
      moveItemInArray(reordered, event.previousIndex, event.currentIndex);
      this.questions.set(reordered.map((question, index) => ({ ...question, displayOrder: index })));
      this.surveyService.reorderQuestions(this.surveyId, this.questions()).subscribe({
        next: (questions) => this.questions.set(questions),
        error: () => this.error.set('Could not reorder questions.'),
      });
      return;
    }

    const block = this.blocks[event.previousIndex];

    if (block.type === 'IMAGE') {
      this.openImageQuestionDialog(event.currentIndex);
      return;
    }

    const question = this.createQuestion(block.type, event.currentIndex);
    this.addQuestion(question, event.currentIndex);
  }

  selectQuestion(question: Question): void {
    this.selectedQuestion = { ...question, options: [...question.options] };
  }

  saveQuestion(): void {
    if (!this.selectedQuestion) return;

    this.surveyService.updateQuestion(this.selectedQuestion).subscribe({
      next: (updated) => {
        this.questions.set(this.questions().map((question) => (question.id === updated.id ? updated : question)));
        this.selectedQuestion = updated;
      },
      error: () => this.error.set('Could not save question.'),
    });
  }

  addOption(question: Question): void {
    question.options.push({
      label: `Option ${question.options.length + 1}`,
      value: `option-${question.options.length + 1}`,
      displayOrder: question.options.length,
    });
  }

  removeOption(question: Question, index: number): void {
    question.options.splice(index, 1);
    question.options.forEach((option, optionIndex) => (option.displayOrder = optionIndex));
  }

  onImageSelected(question: Question, imageKey: string): void {
    const image = this.images().find((item) => item.imageKey === imageKey);
    question.imageKey = image?.imageKey;
    question.imageUrl = image?.imageUrl;
  }

  publish(): void {
    this.surveyService.publish(this.surveyId).subscribe({
      next: (survey) => this.survey.set(survey),
      error: () => this.error.set('Add at least one valid question before publishing.'),
    });
  }

  copyPublicUrl(): void {
    const url = this.survey()?.publicUrl;
    if (!url) return;

    navigator.clipboard.writeText(url);
    this.copied.set(true);
    window.setTimeout(() => this.copied.set(false), 1600);
  }

  private openImageQuestionDialog(displayOrder: number): void {
    const dialogRef = this.dialog.open(ImageQuestionDialog, {
      data: {
        images: this.images(),
        displayOrder,
      },
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result?: { question: Question; images: ImageAsset[] } | null) => {
      if (!result) return;

      this.images.set(result.images);
      this.addQuestion(result.question, displayOrder);
    });
  }

  private addQuestion(question: Question, index: number): void {
    this.surveyService.addQuestion(this.surveyId, question).subscribe({
      next: (created) => {
        const updated = [...this.questions()];
        updated.splice(index, 0, created);
        this.questions.set(updated.map((item, questionIndex) => ({ ...item, displayOrder: questionIndex })));
        this.selectedQuestion = created;
      },
      error: () => this.error.set('Could not add question.'),
    });
  }

  private createQuestion(type: QuestionType, displayOrder: number): Question {
    const base = {
      type,
      title: this.defaultTitle(type),
      description: '',
      displayOrder,
      options: [],
    };

    if (type === 'TEXT') return { ...base, placeholder: 'Type your answer' };

    if (type === 'MULTIPLE_CHOICE') {
      return {
        ...base,
        options: [
          { label: 'Option 1', value: 'option-1', displayOrder: 0 },
          { label: 'Option 2', value: 'option-2', displayOrder: 1 },
        ],
      };
    }

    if (type === 'REACTION_TIME') {
      return { ...base, stimulus: 'BLUE', allowedKeys: 'f,j', delayMs: 800 };
    }

    return base;
  }

  private defaultTitle(type: QuestionType): string {
    if (type === 'TEXT') return 'Open response';
    if (type === 'MULTIPLE_CHOICE') return 'Choose one option';
    if (type === 'IMAGE') return 'Describe the image';
    return 'Reaction time trial';
  }
}