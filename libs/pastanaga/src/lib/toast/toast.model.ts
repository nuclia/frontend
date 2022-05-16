import { BehaviorSubject } from 'rxjs';
import { ComponentFactory } from '@angular/core';
import { ToastComponent } from './toast.component';

export class ToastModel {
  onClick?: BehaviorSubject<string>;

  // Internal toast identifier.
  key: string;

  // Message to be displayed in the toast.
  // To display a link within in a toast message, they must be parsed as: [text_to_be_displayed|anchor_url]
  //
  // 'This is a Google [link|wwww.google.es]' -> This is a Google link (where "link" in an anchor to "www.google.es")
  message: string;
  label = '';

  // params to be used by translate pipe
  translateParams?: any;

  // Number of milliseconds that the toast will be visible before being dismissed automatically.
  // If delay is set to ZERO (0), the toast won't be dismissible until the user interacts with it.
  delay?: number;

  // List of buttons to be displayed.
  buttons: ToastButtonModel[];

  // If true (and no buttons defined), the toast will display a close button (with an icon).
  // If a toast has buttons this property will be ignored.
  closeable?: boolean;

  // Tooltip leading icon.
  icon: string;

  // class to be used for toast style
  style: string;

  componentFactory?: ComponentFactory<ToastComponent>;
  componentData?: any;

  constructor(data: any) {
    // Avoids error when input is null
    data = data ? data : {};

    this.key = data.key;

    this.label = data.label || '';
    this.message = data.message;
    this.delay = typeof data.delay === 'number' ? data.delay : 5000; // dismiss after 5s by default
    this.icon = data.icon;

    this.buttons = data.buttons || [];
    this.closeable = data.closeable;
    this.translateParams = data.translateParams;
    this.style = data.style;
    this.componentFactory = data.componentFactory;
    this.componentData = data.componentData;

    if (this.buttons.length > 0) {
      this.onClick = new BehaviorSubject('');
    }
  }
}

export class ToastButtonModel {
  public static readonly PRIMARY = 'primary';
  public static readonly SECONDARY = 'secondary';
  public static readonly DESTRUCTIVE = 'destructive';

  id: string;
  text: string;
  color: 'primary' | 'secondary' | 'destructive';
  icon: string;
  tooltip: string;

  constructor(data: any) {
    // Avoids error when input is null
    data = data ? data : {};

    this.id = data.id || data.text || data.icon;
    this.text = data.text;
    this.color = data.color || ToastButtonModel.PRIMARY;
    this.icon = data.icon;
    this.tooltip = data.tooltip;
  }
}

export const getToastCloseButton = (): ToastButtonModel => {
  return new ToastButtonModel({ icon: 'clear', color: 'secondary', tooltip: 'common.close', text: 'common.close' });
};
