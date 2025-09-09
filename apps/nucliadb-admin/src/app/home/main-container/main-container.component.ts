import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';


@Component({
  selector: 'nad-main-container',
  template: '<router-outlet></router-outlet>',
  imports: [RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainContainerComponent {}
