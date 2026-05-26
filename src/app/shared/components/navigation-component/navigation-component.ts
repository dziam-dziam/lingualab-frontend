import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';

import { AuthService } from '../../../core/api/auth.service';
import { AuthTokenService } from '../../../core/api/auth-token.service';

@Component({
  selector: 'app-navigation-component',
  imports: [RouterLink, MatButtonModule, MatIconModule, MatToolbarModule],
  templateUrl: './navigation-component.html',
  styleUrl: './navigation-component.css',
})
export class NavigationComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly authToken = inject(AuthTokenService);

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
