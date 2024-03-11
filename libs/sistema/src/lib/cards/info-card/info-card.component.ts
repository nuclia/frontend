import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'nsi-info-card',
  standalone: true,
  imports: [CommonModule],
  template: '<ng-content></ng-content>',
  styleUrl: './info-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoCardComponent {}
