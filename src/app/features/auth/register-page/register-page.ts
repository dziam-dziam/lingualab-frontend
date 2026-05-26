import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { AuthService } from '../../../core/api/auth.service';
import { NavigationComponent } from '../../../shared/components/navigation-component/navigation-component';

@Component({
  selector: 'app-register-page',
  imports: [FormsModule, RouterLink, MatButtonModule, MatFormFieldModule, MatInputModule, NavigationComponent],
  templateUrl: './register-page.html',
  styleUrl: './register-page.css',
})
export class RegisterPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal('');

  registerData = {
    fullName: '',
    email: '',
    password: '',
  };

  register(): void {
    this.loading.set(true);
    this.error.set('');
    this.authService.register(this.registerData).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => {
        this.loading.set(false);
        this.error.set('Could not create that researcher account.');
      },
    });
  }
}
