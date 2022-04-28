import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

export type Actions = 'view' | 'add' | 'add_many' | 'edit' | 'save' | 'delete' | 'close' | 'more' | 'settings' | 'users' | 'generate_key';

const ICONS: { [key in Actions]: string } = {
  'view': 'assets/icons/eye.svg',
  'add': 'assets/icons/add.svg',
  'add_many': 'assets/icons/add-many.svg',
  'save': 'assets/icons/check.svg',
  'edit': 'assets/icons/edit2.svg',
  'delete': 'assets/icons/delete.svg',
  'close': 'assets/icons/cross.svg',
  'settings': 'assets/icons/gear.svg',
  'users': 'assets/icons/manage-users.svg',
  'more': 'assets/icons/dots-vertical.svg',
  'generate_key': 'assets/icons/generate-key.svg',
}

@Component({
  selector: 'app-button-action',
  template: `
    <button
      class="button-action"
      [class.raised]="raised"
      [disabled]="disabled"
      [attr.aria-label]="ariaLabel ? (ariaLabel | translate) : null">
      <svg-icon
        (click)="onClick($event)"
        [src]="src"
        [svgStyle]="iconWidth && iconHeight ? { 'width': iconWidth, 'height': iconHeight } : null">
      </svg-icon>
    </button>
  `,
  styleUrls: ['./button-action.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonActionComponent {

  @Input() action: Actions = 'add';
  @Input() ariaLabel: string | undefined;
  @Input() iconWidth: string | undefined;
  @Input() iconHeight: string | undefined;
  @Input() disabled: boolean = false;
  @Input() raised: boolean = false;

  get src() {
    return ICONS[this.action];
  }

  constructor() { }

  onClick(event: Event): boolean {
    if (this.disabled) {
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
    return true;
  }
}
