import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthTokenService } from '../api/auth-token.service';

export const authGuard: CanActivateFn = () => {
  const token = inject(AuthTokenService);
  const router = inject(Router);

  if (token.isLoggedIn()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
