import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { ImageService } from '../../../core/api/image.service';
import { ImageAsset, Question } from '../../../core/models/api.models';

interface ImageQuestionDialogData {
  images: ImageAsset[];
  displayOrder: number;
}

@Component({
  selector: 'app-image-question-dialog',
  imports: [
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './image-question-dialog.html',
  styleUrl: './image-question-dialog.css',
})
export class ImageQuestionDialog {
  private readonly dialogRef = inject(MatDialogRef<ImageQuestionDialog>);
  private readonly imageService = inject(ImageService);
  private readonly data = inject<ImageQuestionDialogData>(MAT_DIALOG_DATA);

  readonly images = signal<ImageAsset[]>(this.data.images);
  readonly uploading = signal(false);
  readonly error = signal('');

  form = {
    title: 'Describe the image',
    description: '',
    imageKey: '',
  };

  get selectedImage(): ImageAsset | undefined {
    return this.images().find((image) => image.imageKey === this.form.imageKey);
  }

  uploadImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploading.set(true);
    this.error.set('');

    this.imageService.upload(file).subscribe({
      next: (image) => {
        this.images.set([image, ...this.images()]);
        this.form.imageKey = image.imageKey;
        this.uploading.set(false);
      },
      error: () => {
        this.error.set('Could not upload image.');
        this.uploading.set(false);
      },
    });
  }

  addQuestion(): void {
    const image = this.selectedImage;

    if (!image) {
      this.error.set('Choose or upload an image first.');
      return;
    }

    const question: Question = {
      type: 'IMAGE',
      title: this.form.title,
      description: this.form.description,
      imageKey: image.imageKey,
      imageUrl: image.imageUrl,
      displayOrder: this.data.displayOrder,
      options: [],
    };

    this.dialogRef.close({
      question,
      images: this.images(),
    });
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}