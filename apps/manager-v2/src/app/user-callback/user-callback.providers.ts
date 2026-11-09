import { Provider } from '@angular/core';
import { CALLBACK_MESSAGE_VIEW, UserNotifier } from '@nuclia/user';
import { CallbackMessageComponent } from './callback-message/callback-message.component';
import { CallbackNotifierService } from './callback-notifier.service';

export function provideUserCallback(): Provider[] {
  return [
    { provide: UserNotifier, useClass: CallbackNotifierService },
    { provide: CALLBACK_MESSAGE_VIEW, useValue: CallbackMessageComponent },
  ];
}
