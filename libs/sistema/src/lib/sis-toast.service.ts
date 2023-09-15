import { Injectable } from '@angular/core';
import { ToastConfig, ToastService } from '@guillotinaweb/pastanaga-angular';

export const closeButtonConf: ToastConfig = {
  button: {
    icon: 'cross',
    label: 'Close',
    action: () => {
      // No action needed
    },
  },
};

@Injectable({
  providedIn: 'root',
})
export class SisToastService {
  constructor(private paToaster: ToastService) {}

  info(message: string) {
    const conf = { title: 'Information', icon: 'info' };
    this.paToaster.openInfo(message, conf);
  }

  success(message: string) {
    const conf = { title: 'Success', icon: 'circle-check' };
    this.paToaster.openSuccess(message, conf);
  }

  warning(message: string) {
    const conf = { ...closeButtonConf, title: 'Warning', icon: 'warning' };
    this.paToaster.openWarning(message, conf);
  }

  error(message: string) {
    const conf = { ...closeButtonConf, title: 'Error', icon: 'warning' };
    this.paToaster.openError(message, conf);
  }
}
