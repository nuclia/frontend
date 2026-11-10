import { inject, Injectable } from '@angular/core';
import { HlmDialogService } from '@nuclia/ui-spartan/dialog';
import { map, Observable, take } from 'rxjs';
import { UiConfirmData, UiConfirmDialog } from './confirm-dialog.component';

@Injectable({ providedIn: 'root' })
export class UiConfirmService {
  private readonly _dialogService = inject(HlmDialogService);

  public confirm(data: UiConfirmData): Observable<boolean> {
    const dialogRef = this._dialogService.open<boolean, UiConfirmData>(UiConfirmDialog, {
      context: data,
      role: 'alertdialog',
      closeOnOutsidePointerEvents: false,
      showCloseButton: false,
    });
    return dialogRef.closed$.pipe(
      take(1),
      map((confirmed) => confirmed === true),
    );
  }
}
