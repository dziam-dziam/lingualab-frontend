import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ResponseService } from '../../../core/api/response.service';
import { SurveyService } from '../../../core/api/survey.service';
import { AnswerResponse, Question, SubmissionResponse, Survey } from '../../../core/models/api.models';
import { NavigationComponent } from '../../../shared/components/navigation-component/navigation-component';

interface ChartSlice {
  label: string;
  value: number;
  percent: string;
  color: string;
  labelX: number;
  labelY: number;
  showLabel: boolean;
}

interface QuestionChart {
  questionId: string;
  title: string;
  totalAnswers: number;
  pieGradient: string;
  slices: ChartSlice[];
  meanReactionMs?: number;
  fastestReactionMs?: number;
  slowestReactionMs?: number;
}

const CHART_COLORS = ['#3366cc', '#dc3912', '#ff9900', '#109618', '#990099', '#0099c6', '#dd4477', '#66aa00'];

@Component({
  selector: 'app-results-page',
  imports: [NavigationComponent],
  templateUrl: './results-page.html',
  styleUrl: './results-page.css',
})
export class ResultsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly surveyService = inject(SurveyService);
  private readonly responseService = inject(ResponseService);

  readonly survey = signal<Survey | null>(null);
  readonly submissions = signal<SubmissionResponse[]>([]);
  readonly error = signal('');
  readonly questionCharts = computed<QuestionChart[]>(() => {
    const survey = this.survey();
    if (!survey) return [];

    const submissions = this.submissions();
    return survey.questions.map((question) => this.buildQuestionChart(question, submissions));
  });
  readonly participantCount = computed(() => this.submissions().length);

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

  private buildQuestionChart(question: Question, submissions: SubmissionResponse[]): QuestionChart {
    const answers = submissions
      .flatMap((submission) => submission.answers)
      .filter((answer) => answer.questionId === question.id);
    const reactionTimes = answers
      .map((answer) => answer.reactionTimeMs)
      .filter((value): value is number => typeof value === 'number');

    const slices = this.buildSlices(question, answers, submissions.length);

    return {
      questionId: question.id ?? `${question.displayOrder}`,
      title: question.title,
      totalAnswers: answers.length,
      slices,
      pieGradient: this.buildPieGradient(slices),
      meanReactionMs: this.mean(reactionTimes),
      fastestReactionMs: reactionTimes.length ? Math.min(...reactionTimes) : undefined,
      slowestReactionMs: reactionTimes.length ? Math.max(...reactionTimes) : undefined,
    };
  }

  private buildSlices(question: Question, answers: AnswerResponse[], submissionCount: number): ChartSlice[] {
    const chartItems = this.buildChartItems(question, answers, submissionCount).filter((item) => item.value > 0);
    const total = chartItems.reduce((sum, item) => sum + item.value, 0);

    if (total === 0) {
      return [{
        label: 'No responses',
        value: 0,
        percent: '0%',
        color: '#dbe3ef',
        labelX: 50,
        labelY: 50,
        showLabel: false,
      }];
    }

    let cursor = 0;
    return chartItems.map((item, index) => {
      const percentValue = (item.value / total) * 100;
      const midpoint = cursor + percentValue / 2;
      cursor += percentValue;
      const radians = ((midpoint / 100) * 360 - 90) * (Math.PI / 180);

      return {
        label: item.label,
        value: item.value,
        percent: this.formatPercent(percentValue),
        color: CHART_COLORS[index % CHART_COLORS.length],
        labelX: 50 + Math.cos(radians) * 28,
        labelY: 50 + Math.sin(radians) * 28,
        showLabel: percentValue >= 6,
      };
    });
  }

  private buildChartItems(question: Question, answers: AnswerResponse[], submissionCount: number): Array<{ label: string; value: number }> {
    if (question.options.length > 0) {
      const counts = new Map(question.options.map((option) => [option.value, 0]));
      let otherCount = 0;

      for (const answer of answers) {
        if (!answer.selectedOption) continue;
        if (counts.has(answer.selectedOption)) {
          counts.set(answer.selectedOption, (counts.get(answer.selectedOption) ?? 0) + 1);
        } else {
          otherCount += 1;
        }
      }

      const items = question.options.map((option) => ({
        label: option.label,
        value: counts.get(option.value) ?? 0,
      }));

      if (otherCount > 0) {
        items.push({
          label: 'Other',
          value: otherCount,
        });
      }

      return items;
    }

    const answeredCount = answers.filter((answer) => this.hasVisibleAnswer(answer)).length;
    return [
      {
        label: 'Responses',
        value: answeredCount,
      },
      {
        label: 'No response',
        value: Math.max(submissionCount - answeredCount, 0),
      },
    ];
  }

  private hasVisibleAnswer(answer: AnswerResponse): boolean {
    return !!answer.answerText || !!answer.selectedOption || typeof answer.reactionTimeMs === 'number';
  }

  private mean(values: number[]): number | undefined {
    if (!values.length) return undefined;
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  }

  private formatPercent(value: number): string {
    const rounded = Math.round(value * 10) / 10;
    return `${rounded.toFixed(1).replace('.0', '')}%`;
  }

  private buildPieGradient(slices: ChartSlice[]): string {
    const total = slices.reduce((sum, slice) => sum + slice.value, 0);
    if (total === 0) return '#edf2f8';

    let cursor = 0;
    const stops = slices.map((slice) => {
      const start = cursor;
      const end = cursor + (slice.value / total) * 100;
      cursor = end;
      return `${slice.color} ${start}% ${end}%`;
    });

    return `conic-gradient(${stops.join(', ')})`;
  }
}
