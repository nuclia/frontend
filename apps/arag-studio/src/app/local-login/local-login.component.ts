import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

const JWT_KEY = 'JWT_KEY';

@Component({
  selector: 'arag-local-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <h1>ARAG Studio – Local Dev Login</h1>
        <p>
          OAuth is not configured for this local environment.<br />
          Paste a Personal Access Token from
          <a href="https://stashify.cloud" target="_blank">stashify.cloud</a>
          to continue.
        </p>
        <p class="hint">
          Get your token: Dashboard → Account → API keys → Generate Personal Access Token
        </p>
        <textarea
          [formControl]="tokenControl"
          placeholder="Paste your Personal Access Token here…"
          rows="5"
        ></textarea>
        <div class="error" *ngIf="error">{{ error }}</div>
        <button (click)="login()" [disabled]="tokenControl.invalid">Continue</button>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: #f5f5f5;
      font-family: sans-serif;
    }
    .login-card {
      background: white;
      border-radius: 8px;
      padding: 2rem;
      width: 480px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.1);
    }
    h1 { font-size: 1.25rem; margin: 0 0 1rem; }
    p { color: #555; font-size: 0.875rem; line-height: 1.5; margin: 0 0 0.75rem; }
    .hint { color: #888; font-style: italic; }
    textarea {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 0.5rem;
      font-size: 0.8rem;
      font-family: monospace;
      resize: vertical;
      margin: 0.5rem 0;
    }
    button {
      background: #4a90e2;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 0.6rem 1.5rem;
      cursor: pointer;
      font-size: 0.9rem;
    }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .error { color: red; font-size: 0.8rem; margin-bottom: 0.5rem; }
  `],
})
export class LocalLoginComponent {
  tokenControl = new FormControl<string>('', { nonNullable: true, validators: [Validators.required] });
  error: string | null = null;

  constructor(private router: Router) {}

  login() {
    const token = this.tokenControl.value.trim();
    if (!token) return;
    localStorage.setItem(JWT_KEY, token);
    const returnUrl = sessionStorage.getItem('nextUrl') || '/';
    this.router.navigateByUrl(returnUrl);
  }
}
