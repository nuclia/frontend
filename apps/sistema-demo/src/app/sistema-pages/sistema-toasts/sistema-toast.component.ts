import { Component } from '@angular/core';
import { ToastType } from '@guillotinaweb/pastanaga-angular';
import { SisToastService } from '@nuclia/sistema';

@Component({
  templateUrl: './sistema-toast.component.html',
})
export class SistemaToastComponent {
  code = `constructor(private toaster: SisToastService) {}
//…
this.toaster.openInfo(message);
this.toaster.openSuccess(message);
this.toaster.openWarning(message);
this.toaster.openError(message);`;

  selectedType: ToastType = 'info';

  constructor(private toaster: SisToastService) {}

  openToast() {
    const message = `${this.selectedType.charAt(0).toUpperCase() + this.selectedType.substring(1)} message description`;

    this._openToast(message);
  }

  private _openToast(message: string) {
    switch (this.selectedType) {
      case 'info':
        this.toaster.openInfo(message);
        break;
      case 'success':
        this.toaster.openSuccess(message);
        break;
      case 'warning':
        this.toaster.openWarning(message);
        break;
      case 'error':
        this.toaster.openError(message);
        break;
    }
  }
}
