import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { AuthService } from '../../../core/api/auth.service';
import { NavigationComponent } from '../../../shared/components/navigation-component/navigation-component';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule, RouterLink, MatButtonModule, MatFormFieldModule, MatInputModule, NavigationComponent],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
})
export class LoginPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal('');

  loginData = {
    email: '',
    password: '',
  };

  login(): void {
    this.loading.set(true);
    this.error.set('');
    this.authService.login(this.loginData).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => {
        this.loading.set(false);
        this.error.set('Could not log in with those credentials.');
      },
    });
  }
}
