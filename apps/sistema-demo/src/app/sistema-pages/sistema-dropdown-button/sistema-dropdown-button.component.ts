import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'nsd-sistema-dropdown-button',
  templateUrl: './sistema-dropdown-button.component.html',
  styleUrls: ['./sistema-dropdown-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SistemaDropdownButtonComponent {
  options = [
    { key: '20', value: '20 resources' },
    { key: '50', value: '50 resources' },
    { key: '100', value: '100 resources' },
  ];

  pageSize1 = this.options[0];
  pageSize2 = this.options[0];
  pageSize3 = this.options[0];
  disabled = false;

  dropdown1Open = false;
  dropdown2Open = false;
  dropdown3Open = false;

  code = `<nsi-dropdown-button [popupRef]="pageSizeMenu"
                     [open]="isOpen"
                     [disabled]="disabled">
  {{pageSize.value}}
</nsi-dropdown-button>

<pa-dropdown #pageSizeMenu
             (onClose)="isOpen = false"
             (onOpen)="isOpen = true">
  <pa-option *ngFor="let option of options"
             [value]="option.key"
             (selectOption)="setPageSize(option)">{{option.value}}</pa-option>
</pa-dropdown>`;

  setPageSize(option: { key: string; value: string }, dropdownIndex: number) {
    switch (dropdownIndex) {
      case 1:
        this.pageSize1 = option;
        break;
      case 2:
        this.pageSize2 = option;
        break;
      case 3:
        this.pageSize3 = option;
        break;
    }
  }
}
