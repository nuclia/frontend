import {
  ComponentFactoryResolver,
  ComponentRef,
  Injectable,
  ViewContainerRef,
  ComponentFactory,
  NgZone,
} from '@angular/core';
import { ToastComponent } from './toast.component';
import { ToastModel, ToastButtonModel } from './toast.model';

@Injectable({
  providedIn: 'root',
})
export class Toaster {
  private entryPoint?: ViewContainerRef;
  private toasts?: ComponentRef<ToastComponent>[];

  private toastCounter = 0;

  constructor(private componentFactoryResolver: ComponentFactoryResolver, private zone: NgZone) {
    this.toasts = [];
  }

  registerContainer(entryPoint: ViewContainerRef) {
    this.entryPoint = entryPoint;
  }

  /**
   * Displays a new toast.
   *
   * @param toast
   *     Can either be an ToastModel object describing the entire toast or just a message to be displayed.
   *
   * @param button | closeable | delay
   *     If a string is provided, a dismiss button will be displayed with that text.
   *     If a boolean is provided the toast will auto-dismiss based on that value.
   *     If a number is provided, the toast will dismiss itself after that amount of milliseconds.
   *
   * @param closeable | delay
   *     If a boolean is provided the toast will auto-dismiss based on that value.
   *     If a number is provided, the toast will dismiss itself after that amount of milliseconds.
   *
   * @param delay
   *     If a number is provided, the toast will dismiss itself after that amount of milliseconds.
   *
   *     An auto-dismissible toast with 5 seconds delay and no buttons will be display otherwise.
   */
  open(toast: ToastModel | string, button?: string | boolean | number, closeable?: boolean | number, delay?: number) {
    if (toast instanceof ToastModel) {
      this.createToast(toast);
    } else {
      this.openQuickToast(toast, button, closeable, delay);
    }
  }

  private openQuickToast(
    message: string,
    button?: string | boolean | number,
    closeable?: boolean | number,
    delay?: number
  ) {
    const buttonText = this.isString(button) ? button : '';
    const closeableValue = this.isBoolean(button) ? button : this.isBoolean(closeable) ? closeable : false;
    const delayValue = this.isNumber(button)
      ? button
      : this.isNumber(closeable)
      ? closeable
      : this.isNumber(delay)
      ? delay
      : 5000;

    const quickToast = new ToastModel({ message: message, delay: delayValue });
    if (buttonText) {
      const quickButton = new ToastButtonModel({ text: buttonText });
      quickToast.buttons = [quickButton];
    } else if (closeableValue) {
      // Fixme: Use the tooltip version when fixed
      // const cancelButton = new ToastButtonModel({icon: 'clear', color: 'secondary', tooltip: 'Close'});
      const cancelButton = new ToastButtonModel({ icon: 'clear', color: 'secondary' });
      quickToast.buttons = [cancelButton];
    }

    this.createToast(quickToast);
  }

  private isString(value: any) {
    return typeof value === 'string';
  }

  private isBoolean(value: any) {
    return typeof value === 'boolean';
  }

  private isNumber(value: any) {
    return typeof value === 'number';
  }

  dismiss(toast: ToastModel, button?: string) {
    const index = this.getToastIndex(toast.key);
    if (index < 0) {
      // Return if the toast was already dismissed.
      return;
    }

    if (!!this.toasts) {
      const toastComponentRef = this.toasts[index];

      this.toasts.splice(index, 1);
      this.toasts.forEach((message, i) => (message.instance.isSibling = i > 0));
      toastComponentRef.instance.isDismissed = true;
      setTimeout(() => {
        this.zone.run(() => toastComponentRef.destroy());
      }, 500);
    }

    if (!!button && toast.onClick) {
      toast.onClick.next(button);
    }
  }

  private getToastIndex(key: string): number {
    let index = -1;
    if (!!this.toasts) {
      for (let i = 0; i < this.toasts.length; i++) {
        const toast = this.toasts[i];
        if (toast.instance && toast.instance.toast && toast.instance.toast.key === key) {
          index = i;
          break;
        }
      }
    }

    return index;
  }

  private createToast(toast: ToastModel) {
    this.zone.run(() => {
      toast.key = 'toast' + this.toastCounter++;
      const componentFactory: ComponentFactory<ToastComponent> = toast.componentFactory
        ? toast.componentFactory
        : this.componentFactoryResolver.resolveComponentFactory(ToastComponent);
      if (!!this.entryPoint && !!this.toasts) {
        const toastComponentRef: ComponentRef<ToastComponent> = this.entryPoint.createComponent(componentFactory, 0);
        (<ToastComponent>toastComponentRef.instance).toast = toast;
        (<ToastComponent>toastComponentRef.instance).isSibling = this.toasts.length > 0;
        (<ToastComponent>toastComponentRef.instance).dismiss.subscribe((toastToDismiss: any) =>
          this.dismiss(toastToDismiss.toast, toastToDismiss.button)
        );
        (<ToastComponent>toastComponentRef.instance).refresh();

        this.toasts.push(toastComponentRef);
      }
    });
  }
}
