import { ImageAsset, Question, Survey } from '../models/api.models';

export function normalizeImageUrl(imageUrl: string | undefined, apiBaseUrl: string): string | undefined {
  if (!imageUrl) return imageUrl;

  const normalizedApiBaseUrl = apiBaseUrl.replace(/\/$/, '');
  const uploadsPath = '/api/uploads/';
  const uploadsIndex = imageUrl.indexOf(uploadsPath);

  if (uploadsIndex >= 0) {
    return `${normalizedApiBaseUrl}/uploads/${imageUrl.slice(uploadsIndex + uploadsPath.length)}`;
  }

  if (imageUrl.startsWith('/uploads/')) {
    return `${normalizedApiBaseUrl}${imageUrl}`;
  }

  return imageUrl;
}

export function normalizeImageAsset(image: ImageAsset, apiBaseUrl: string): ImageAsset {
  return {
    ...image,
    imageUrl: normalizeImageUrl(image.imageUrl, apiBaseUrl) ?? image.imageUrl,
  };
}

export function normalizeQuestionImages(question: Question, apiBaseUrl: string): Question {
  return {
    ...question,
    imageUrl: normalizeImageUrl(question.imageUrl, apiBaseUrl),
  };
}

export function normalizeSurveyImages(survey: Survey, apiBaseUrl: string): Survey {
  return {
    ...survey,
    questions: survey.questions.map((question) => normalizeQuestionImages(question, apiBaseUrl)),
  };
}