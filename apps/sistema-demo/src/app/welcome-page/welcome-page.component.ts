import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  templateUrl: './welcome-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class WelcomePageComponent {}
