import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { BuilderPage } from './features/builder/builder-page/builder-page';
import { DashboardPage } from './features/dashboard/dashboard-page/dashboard-page';
import { LoginPage } from './features/auth/login-page/login-page';
import { PublicSurveyPage } from './features/public-survey/public-survey-page/public-survey-page';
import { RegisterPage } from './features/auth/register-page/register-page';
import { ResultsPage } from './features/results/results-page/results-page';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'login',
    component: LoginPage,
  },
  {
    path: 'register',
    component: RegisterPage,
  },
  {
    path: 'dashboard',
    component: DashboardPage,
    canActivate: [authGuard],
  },
  {
    path: 'builder/:surveyId',
    component: BuilderPage,
    canActivate: [authGuard],
  },
  {
    path: 'results/:surveyId',
    component: ResultsPage,
    canActivate: [authGuard],
  },
  {
    path: 'survey/:publicId',
    component: PublicSurveyPage,
  },
];
