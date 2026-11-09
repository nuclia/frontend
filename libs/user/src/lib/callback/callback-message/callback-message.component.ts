import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { UserContainerComponent } from '../../user-container';

@Component({
  selector: 'lib-callback-message',
  templateUrl: './callback-message.component.html',
  styleUrls: ['../../_user-layout.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UserContainerComponent],
})
export class CallbackMessageComponent {
  readonly message = input.required<string>();
}
