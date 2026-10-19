import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ToastType } from '@guillotinaweb/pastanaga-angular';
import { SisToastService } from '@nuclia/sistema';
import { PaDemoModule } from '../../../../../../../libs/pastanaga-angular/projects/demo/src/app/demo/demo.module';
import { PaButtonModule } from '../../../../../../../libs/pastanaga-angular/projects/pastanaga-angular/src/lib/button/button.module';
import { PaTextFieldModule } from '../../../../../../../libs/pastanaga-angular/projects/pastanaga-angular/src/lib/controls/textfield/text-field.module';
import { FormsModule } from '@angular/forms';
import { PaDropdownModule } from '../../../../../../../libs/pastanaga-angular/projects/pastanaga-angular/src/lib/dropdown/dropdown.module';

@Component({
    templateUrl: './sistema-toast.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [
        PaDemoModule,
        PaButtonModule,
        PaTextFieldModule,
        FormsModule,
        PaDropdownModule,
    ],
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
