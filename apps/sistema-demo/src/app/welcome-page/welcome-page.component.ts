import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PaDemoModule } from '@guillotinaweb/pastanaga-angular/demo';

@Component({
  templateUrl: './welcome-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaDemoModule],
})
export class WelcomePageComponent {}
