import { Injectable } from '@angular/core';
import { SisToastService } from '@nuclia/sistema';

@Injectable({ providedIn: 'root', useExisting: SisToastService })
export abstract class UserNotifier {
  abstract error(message: string): void;
}
