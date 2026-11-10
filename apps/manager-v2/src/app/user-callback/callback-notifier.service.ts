import { inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { toast } from '@spartan-ng/brain/sonner';
import { UserNotifier } from '@nuclia/user';

@Injectable()
export class CallbackNotifierService extends UserNotifier {
  private readonly translate = inject(TranslateService);

  error(message: string): void {
    this.translate.get(message).subscribe((text) => toast.error(text));
  }
}
