import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { UserContainerComponent } from '../user-container/user-container.component';

@Component({
  selector: 'app-setup-farewell',
  templateUrl: './farewell.component.html',
  styleUrls: ['./farewell.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [UserContainerComponent, TranslatePipe],
})
export class FarewellComponent {}
