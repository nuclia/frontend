import { Component } from '@angular/core';
import {
  AccessibilityPageComponent,
  AvatarPageComponent,
  AvatarPilePageComponent,
  BreakpointPageComponent,
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
import { SistemaLabelComponent } from './sistema-pages/sistema-label/sistema-label.component';
import { RadioPageComponent } from '../../../../libs/pastanaga-angular/projects/demo/src/app/demo/pages/radio-page/radio-page.component';
import {
  SistemaButtonsComponent,
  SistemaConfirmationDialogComponent,
  SistemaIconsComponent,
  SistemaModalComponent,
  SistemaPaletteComponent,
  SistemaScrollbarComponent,
  SistemaTableComponent,
  SistemaToastComponent,
} from './sistema-pages/pastanaga-pages-override';

export const menu: IDemoMenuSection[] = [
  {
    title: 'Core',
    pages: [
      { view: 'icon', title: 'Icons', type: SistemaIconsComponent },
      { view: 'palette', title: 'Palette', type: SistemaPaletteComponent },
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
    title: 'Nuclia components',
    pages: [{ view: 'label', title: 'Label', type: SistemaLabelComponent }],
  },
  {
    title: 'Pastanaga components',
    pages: [
      { view: 'avatar', title: 'Avatar', type: AvatarPageComponent },
      { view: 'avatar-pile', title: 'Avatar pile', type: AvatarPilePageComponent },
      { view: 'button', title: 'Button', type: SistemaButtonsComponent },
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
      { view: 'formControl', title: 'Form control', type: FormControlPageComponent },
      { view: 'formFieldHint', title: 'Form field hint', type: FormFieldHintPageComponent },
      { view: 'nativeTextField', title: 'Native Text Field', type: NativeTextFieldPageComponent },
    ],
  },
  {
    title: 'Pastanaga Tables',
    pages: [
      { view: 'table', title: 'Table', type: SistemaTableComponent },
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
  template: ` <pa-demo [menu]="menu" [logo]="logo"></pa-demo>`,
  styles: [],
})
export class AppComponent {
  menu: IDemoMenuSection[] = menu;

  logo = './assets/logo.svg';
}
