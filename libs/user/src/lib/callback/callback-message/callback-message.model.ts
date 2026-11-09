import { InjectionToken, InputSignal, Type } from '@angular/core';
import { CallbackMessageComponent } from './callback-message.component';

export interface CallbackMessageView {
  message: InputSignal<string>;
}

export const CALLBACK_MESSAGE_VIEW = new InjectionToken<Type<CallbackMessageView>>('CALLBACK_MESSAGE_VIEW', {
  providedIn: 'root',
  factory: () => CallbackMessageComponent,
});
