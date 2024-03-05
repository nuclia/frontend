import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'nsi-help-card',
  standalone: true,
  imports: [CommonModule],
  template: '<ng-content></ng-content>',
  styleUrl: './help-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpCardComponent {}
