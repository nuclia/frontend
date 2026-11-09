import { inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { UiToastService } from '@nuclia/ui/toast';
import { UserNotifier } from '@nuclia/user';

@Injectable()
export class CallbackNotifierService extends UserNotifier {
  private readonly toast = inject(UiToastService);
  private readonly translate = inject(TranslateService);

  error(message: string): void {
    this.translate.get(message).subscribe((text) => this.toast.error(text));
  }
}
