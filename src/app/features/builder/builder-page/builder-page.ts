import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { ImageService } from '../../../core/api/image.service';
import { SurveyService } from '../../../core/api/survey.service';
import { ImageAsset, Question, QuestionType, ReactionStimulusType, Survey } from '../../../core/models/api.models';
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
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatDialogModule,
    MatSnackBarModule,
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
  private readonly snackBar = inject(MatSnackBar);

  readonly survey = signal<Survey | null>(null);
  readonly questions = signal<Question[]>([]);
  readonly images = signal<ImageAsset[]>([]);
  readonly loadingSurvey = signal(false);
  readonly savingQuestion = signal(false);
  readonly addingQuestion = signal(false);
  readonly deletingQuestionId = signal<string | null>(null);
  readonly uploadingReactionImage = signal(false);
  readonly publishing = signal(false);
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
    this.loadingSurvey.set(true);
    this.surveyService.getById(this.surveyId).subscribe({
      next: (survey) => {
        this.survey.set(survey);
        this.questions.set([...survey.questions]);
        this.loadingSurvey.set(false);
      },
      error: () => {
        this.loadingSurvey.set(false);
        this.showError('Could not load study.');
      },
    });
  }

  loadImages(): void {
    this.imageService.getAll().subscribe({
      next: (images) => this.images.set(images),
      error: () => this.showError('Could not load image library.'),
    });
  }

  drop(event: CdkDragDrop<Question[], BuilderBlock[] | Question[]>): void {
    if (event.previousContainer === event.container) {
      const reordered = [...this.questions()];
      moveItemInArray(reordered, event.previousIndex, event.currentIndex);
      this.questions.set(reordered.map((question, index) => ({ ...question, displayOrder: index })));
      this.surveyService.reorderQuestions(this.surveyId, this.questions()).subscribe({
        next: (questions) => this.questions.set(questions),
        error: () => this.showError('Could not reorder questions.'),
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

  deleteQuestion(question: Question): void {
    if (!question?.id) return;

    this.deletingQuestionId.set(question.id);
    this.surveyService.deleteQuestion(question.id).subscribe({
      next: () => {
        const updated = this.questions()
          .filter((item) => item.id !== question.id)
          .map((item, index) => ({ ...item, displayOrder: index }));

        this.questions.set(updated);
        this.deletingQuestionId.set(null);

        if (this.selectedQuestion?.id === question.id) {
          this.selectedQuestion = null;
        }

        this.showSuccess('Question deleted.');

        if (updated.length > 0) {
          this.surveyService.reorderQuestions(this.surveyId, updated).subscribe({
            next: (questions) => this.questions.set(questions),
            error: () => this.showError('Question deleted, but order could not be saved.'),
          });
        }
      },
      error: () => {
        this.deletingQuestionId.set(null);
        this.showError('Could not delete question. Check if you are logged in as this survey owner.');
      },
    });
  }

  selectQuestion(question: Question): void {
    this.selectedQuestion = { ...question, options: [...question.options] };
  }

  saveQuestion(): void {
    if (!this.selectedQuestion) return;
    this.savingQuestion.set(true);
    this.surveyService.updateQuestion(this.selectedQuestion).subscribe({
      next: (updated) => {
        this.questions.set(this.questions().map((question) => (question.id === updated.id ? updated : question)));
        this.selectedQuestion = updated;
        this.savingQuestion.set(false);
        this.showSuccess('Question saved.');
      },
      error: () => {
        this.savingQuestion.set(false);
        this.showError('Could not save question.');
      },
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

  uploadReactionImage(question: Question, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploadingReactionImage.set(true);
    this.imageService.upload(file).subscribe({
      next: (image) => {
        this.images.set([image, ...this.images()]);
        question.imageKey = image.imageKey;
        question.imageUrl = image.imageUrl;
        this.uploadingReactionImage.set(false);
        this.showSuccess('Image uploaded.');
        input.value = '';
      },
      error: () => {
        this.uploadingReactionImage.set(false);
        this.showError('Could not upload image.');
        input.value = '';
      },
    });
  }

  onReactionStimulusTypeSelected(question: Question, reactionStimulusType: ReactionStimulusType): void {
    question.reactionStimulusType = reactionStimulusType;

    if (reactionStimulusType !== 'IMAGE') {
      question.imageKey = undefined;
      question.imageUrl = undefined;
    }

    if (reactionStimulusType !== 'VIDEO') {
      question.videoUrl = undefined;
    }

    if (reactionStimulusType === 'WORD') {
      question.stimulus ||= 'BLUE';
    }

    if (reactionStimulusType === 'TEXT') {
      question.stimulus ||= 'Read this text and choose an option.';
    }

    if (reactionStimulusType === 'MULTIPLE_CHOICE') {
      question.stimulus ||= 'Choose the matching option.';
    }
  }

  publish(): void {
    this.publishing.set(true);
    this.surveyService.publish(this.surveyId).subscribe({
      next: (survey) => {
        this.survey.set(survey);
        this.publishing.set(false);
        this.showSuccess('Survey published.');
      },
      error: () => {
        this.publishing.set(false);
        this.showError('Add at least one valid question before publishing.');
      },
    });
  }

  copyPublicUrl(): void {
    const url = this.survey()?.publicUrl;
    if (!url) return;
    navigator.clipboard.writeText(url);
    this.copied.set(true);
    window.setTimeout(() => this.copied.set(false), 1600);
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
      return {
        ...base,
        reactionStimulusType: 'WORD',
        stimulus: 'BLUE',
        allowedKeys: 'f,j',
        delayMs: 800,
        options: [
          { label: 'Option 1', value: 'option-1', displayOrder: 0 },
          { label: 'Option 2', value: 'option-2', displayOrder: 1 },
        ],
      };
    }
    return base;
  }

  private defaultTitle(type: QuestionType): string {
    if (type === 'TEXT') return 'Open response';
    if (type === 'MULTIPLE_CHOICE') return 'Choose one option';
    if (type === 'IMAGE') return 'Describe the image';
    return 'Reaction time trial';
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
    this.addingQuestion.set(true);
    this.surveyService.addQuestion(this.surveyId, question).subscribe({
      next: (created) => {
        const updated = [...this.questions()];
        updated.splice(index, 0, created);
        this.questions.set(updated.map((item, questionIndex) => ({ ...item, displayOrder: questionIndex })));
        this.selectedQuestion = created;
        this.addingQuestion.set(false);
        this.showSuccess('Question added.');
      },
      error: () => {
        this.addingQuestion.set(false);
        this.showError('Could not add question.');
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
