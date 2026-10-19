import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PaButtonModule, PaDropdownModule, PaTextFieldModule, ToastType } from '@guillotinaweb/pastanaga-angular';
import { PaDemoModule } from '@guillotinaweb/pastanaga-angular/demo';
import { SisToastService } from '@nuclia/sistema';

@Component({
  templateUrl: './sistema-toast.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [PaDemoModule, PaButtonModule, PaTextFieldModule, FormsModule, PaDropdownModule],
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
        this.toaster.info(message);
        break;
      case 'success':
        this.toaster.success(message);
        break;
      case 'warning':
        this.toaster.warning(message);
        break;
      case 'error':
        this.toaster.error(message);
        break;
    }
  }
}
