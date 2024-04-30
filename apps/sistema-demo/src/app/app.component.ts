import { Component } from '@angular/core';
import {
  AccessibilityPageComponent,
  AvatarPageComponent,
  AvatarPilePageComponent,
  BreakpointPageComponent,
  ButtonPageComponent,
  CardPageComponent,
  CheckboxPageComponent,
  ChipPageComponent,
  ContainerPageComponent,
  DatePickerPageComponent,
  DateTimePageComponent,
  DistributePageComponent,
  DropdownPageComponent,
  EllipsisTooltipPageComponent,
  ExpanderPageComponent,
  FocusablePageComponent,
  FormControlPageComponent,
  FormFieldHintPageComponent,
  GridPageComponent,
  IDemoMenuSection,
  InfiniteScrollPageComponent,
  InputPageComponent,
  NativeTextFieldPageComponent,
  PopoverPageComponent,
  PopupPageComponent,
  SelectPageComponent,
  SidenavPageComponent,
  TableCellPageComponent,
  TableLeadCellMultiLinePageComponent,
  TablePageComponent,
  TableRowPageComponent,
  TableSortableHeaderCellPageComponent,
  TableSortableHeaderPageComponent,
  TabsPageComponent,
  TextareaPageComponent,
  TogglePageComponent,
  TooltipPageComponent,
  TranslatePageComponent,
  TypographyPageComponent,
} from '../../../../libs/pastanaga-angular/projects/demo/src';
import { RadioPageComponent } from '../../../../libs/pastanaga-angular/projects/demo/src/app/demo/pages/radio-page/radio-page.component';
import {
  SistemaConfirmationDialogComponent,
  SistemaIconsComponent,
  SistemaModalComponent,
  SistemaScrollbarComponent,
  SistemaToastComponent,
} from './sistema-pages/pastanaga-pages-override';
import {
  SistemaActionCardComponent,
  SistemaBackButtonComponent,
  SistemaDropdownButtonComponent,
  SistemaFolderTreeComponent,
  SistemaLabelComponent,
  SistemaPasswordInputComponent,
  SistemaSegmentedButtonsComponent,
  SistemaSpinnerComponent,
  SistemaStickyFooterComponent,
  SistemaTwoColumnsConfigurationItemComponent,
} from './sistema-pages';
import { SliderPageComponent } from '../../../../libs/pastanaga-angular/projects/demo/src/app/demo/pages/slider-page/slider-page.component';
import { SistemaInfoCardComponent } from './sistema-pages/sistema-cards/sistema-info-card.component';
import { SistemaBadgeComponent } from './sistema-pages/sistema-badge/sistema-badge.component';
import { SistemaPalettePageComponent } from './sistema-pages/pastanaga-pages-override/sistema-palette/sistema-palette.component';

export const menu: IDemoMenuSection[] = [
  {
    title: 'Core',
    pages: [
      { view: 'icon', title: 'Icons', type: SistemaIconsComponent },
      { view: 'palette', title: 'Palette', type: SistemaPalettePageComponent },
      { view: 'typography', title: 'Typography', type: TypographyPageComponent },
      { view: 'focusable', title: 'Focusable', type: FocusablePageComponent },
      { view: 'accessibility', title: 'Accessibility', type: AccessibilityPageComponent },
      { view: 'containers', title: 'Containers', type: ContainerPageComponent },
      { view: 'distribute', title: 'Distribute', type: DistributePageComponent },
      { view: 'grid', title: 'Grid', type: GridPageComponent },
      { view: 'breakpoint', title: 'Breakpoint', type: BreakpointPageComponent },
      { view: 'scrollbar', title: 'Scrollbar', type: SistemaScrollbarComponent },
      { view: 'translate', title: 'Translate', type: TranslatePageComponent },
    ],
  },
  {
    title: 'Nuclia Sistema',
    pages: [
      { view: 'action-card', title: 'Action card', type: SistemaActionCardComponent },
      { view: 'badge', title: 'Badges', type: SistemaBadgeComponent },
      { view: 'info-card', title: 'Info card', type: SistemaInfoCardComponent },
      { view: 'back-button', title: 'Back button', type: SistemaBackButtonComponent },
      { view: 'dropdown-button', title: 'Dropdown button', type: SistemaDropdownButtonComponent },
      { view: 'folder-tree', title: 'Folder tree', type: SistemaFolderTreeComponent },
      { view: 'label', title: 'Label', type: SistemaLabelComponent },
      { view: 'password-input', title: 'Password input', type: SistemaPasswordInputComponent },
      { view: 'segmented-buttons', title: 'Segmented buttons', type: SistemaSegmentedButtonsComponent },
      { view: 'spinner', title: 'Spinner', type: SistemaSpinnerComponent },
      { view: 'sticky-footer', title: 'Sticky footer', type: SistemaStickyFooterComponent },
      {
        view: 'two-columns-config-item',
        title: 'Two columns configuration item',
        type: SistemaTwoColumnsConfigurationItemComponent,
      },
    ],
  },
  {
    title: 'Pastanaga components',
    pages: [
      { view: 'avatar', title: 'Avatar', type: AvatarPageComponent },
      { view: 'avatar-pile', title: 'Avatar pile', type: AvatarPilePageComponent },
      { view: 'button', title: 'Button', type: ButtonPageComponent },
      { view: 'card', title: 'Card', type: CardPageComponent },
      { view: 'chip', title: 'Chip', type: ChipPageComponent },
      { view: 'confirmation-dialog', title: 'Confirmation dialog', type: SistemaConfirmationDialogComponent },
      { view: 'modal', title: 'Modal', type: SistemaModalComponent },
      { view: 'datepicker', title: 'Date Picker', type: DatePickerPageComponent },
      { view: 'datetime', title: 'Date/time', type: DateTimePageComponent },
      { view: 'dropdown', title: 'Dropdown', type: DropdownPageComponent },
      { view: 'expander', title: 'Expander', type: ExpanderPageComponent },
      { view: 'infinite-scroll', title: 'Infinite scroll', type: InfiniteScrollPageComponent },
      { view: 'popup', title: 'Popup', type: PopupPageComponent },
      { view: 'popover', title: 'Popover', type: PopoverPageComponent },
      { view: 'sidenav', title: 'Sidenav', type: SidenavPageComponent },
      { view: 'tabs', title: 'Tabs', type: TabsPageComponent },
      { view: 'toast', title: 'Toast', type: SistemaToastComponent },
      { view: 'tooltip', title: 'Tooltip', type: TooltipPageComponent },
      { view: 'tooltip-ellipsis', title: 'Ellipsis tooltip', type: EllipsisTooltipPageComponent },
    ],
  },
  {
    title: 'Pastanaga Form elements',
    pages: [
      { view: 'checkbox', title: 'Checkbox', type: CheckboxPageComponent },
      { view: 'radio', title: 'Radio', type: RadioPageComponent },
      { view: 'input', title: 'Input', type: InputPageComponent },
      { view: 'select', title: 'Select', type: SelectPageComponent },
      { view: 'textarea', title: 'Textarea', type: TextareaPageComponent },
      { view: 'toggle', title: 'Toggle', type: TogglePageComponent },
      { view: 'slider', title: 'Slider', type: SliderPageComponent },
      { view: 'formControl', title: 'Form control', type: FormControlPageComponent },
      { view: 'formFieldHint', title: 'Form field hint', type: FormFieldHintPageComponent },
      { view: 'nativeTextField', title: 'Native Text Field', type: NativeTextFieldPageComponent },
    ],
  },
  {
    title: 'Pastanaga Tables',
    pages: [
      { view: 'table', title: 'Table', type: TablePageComponent },
      { view: 'table-row', title: 'Table row', type: TableRowPageComponent },
      { view: 'table-cell', title: 'Table cell', type: TableCellPageComponent },
      {
        view: 'table-lead-cell-multi-line',
        title: 'Table lead cell multi line',
        type: TableLeadCellMultiLinePageComponent,
      },
      { view: 'table-sortable-header', title: 'Table sortable header', type: TableSortableHeaderPageComponent },
      {
        view: 'table-sortable-header-cell',
        title: 'Table sortable header cell',
        type: TableSortableHeaderCellPageComponent,
      },
    ],
  },
];

@Component({
  selector: 'nsd-root',
  template: `
    <pa-demo
      [menu]="menu"
      [logo]="logo"></pa-demo>
  `,
  styles: [],
})
export class AppComponent {
  menu: IDemoMenuSection[] = menu;
  logo = './assets/logos/logo.svg';
}
