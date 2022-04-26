import { Injectable } from '@angular/core';
import { Toaster } from '@flaps/pastanaga';
import { TranslatePipe } from '@ngx-translate/core';
import { ToastModel } from 'libs/pastanaga/src/lib/toast/toast.model';

@Injectable({ providedIn: 'root' })
export class AppToasterService {
  constructor(private toaster: Toaster, private translate: TranslatePipe) {}

  private displayToast(message: string, status: 'info' | 'error' | 'warning' | 'success', noDelay = false) {
    this.toaster.open(
      new ToastModel({
        label: this.translate.transform(`toast.${status}`),
        message: this.translate.transform(message),
        icon: `assets/icons/toast-${status}.svg`,
        closeable: true,
        delay: noDelay ? 0 : undefined,
        style: `toast-${status}`,
      })
    );
  }

  info(message: string) {
    this.displayToast(message, 'info');
  }

  error(message: string) {
    this.displayToast(message, 'error', true);
  }

  warning(message: string) {
    this.displayToast(message, 'warning');
  }

  success(message: string) {
    this.displayToast(message, 'success');
  }
}
