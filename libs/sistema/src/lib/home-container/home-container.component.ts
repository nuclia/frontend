import { ChangeDetectionStrategy, Component } from '@angular/core';


@Component({
  selector: 'nsi-home-container',
  standalone: true,
  imports: [],
  template: '<ng-content></ng-content>',
  styleUrl: './home-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeContainerComponent {}
