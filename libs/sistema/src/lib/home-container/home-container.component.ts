import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'nsi-home-container',
  standalone: true,
  imports: [CommonModule],
  template: '<ng-content></ng-content>',
  styleUrl: './home-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeContainerComponent {}
