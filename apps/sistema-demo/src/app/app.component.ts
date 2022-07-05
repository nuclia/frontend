import { Component } from '@angular/core';
import {
  AccessibilityPageComponent,
  AvatarPageComponent,
  AvatarPilePageComponent,
  BreakpointPageComponent,
  CardPageComponent,
  CheckboxPageComponent,
  ChipPageComponent,
  ConfirmationDialogPageComponent,
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
import { SistemaPaletteComponent } from './sistema-pages/sistema-palette/sistema-palette.component';
import { SistemaIconsComponent } from './sistema-pages/sistema-icons/sistema-icons.component';
import { SistemaTableComponent } from './sistema-pages/sistema-tables/sistema-table.component';
import { SistemaScrollbarComponent } from './sistema-pages/sistema-scrollbar/sistema-scrollbar.component';
import { SistemaLabelComponent } from './sistema-pages/sistema-label/sistema-label.component';
import { SistemaModalComponent } from './sistema-pages/sistema-modal';
import { SistemaButtonsComponent } from './sistema-pages/sistema-buttons/sistema-buttons.component';
import { SistemaToastComponent } from './sistema-pages/sistema-toasts/sistema-toast.component';

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
    title: 'Components',
    pages: [
      { view: 'avatar', title: 'Avatar', type: AvatarPageComponent },
      { view: 'avatar-pile', title: 'Avatar pile', type: AvatarPilePageComponent },
      { view: 'button', title: 'Button', type: SistemaButtonsComponent },
      { view: 'card', title: 'Card', type: CardPageComponent },
      { view: 'chip', title: 'Chip', type: ChipPageComponent },
      { view: 'label', title: 'Label', type: SistemaLabelComponent },
      { view: 'confirmation-dialog', title: 'Confirmation dialog', type: ConfirmationDialogPageComponent },
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
    title: 'Tables',
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
  {
    title: 'Form elements',
    pages: [
      { view: 'checkbox', title: 'Checkbox', type: CheckboxPageComponent },
      { view: 'input', title: 'Input', type: InputPageComponent },
      { view: 'select', title: 'Select', type: SelectPageComponent },
      { view: 'textarea', title: 'Textarea', type: TextareaPageComponent },
      { view: 'toggle', title: 'Toggle', type: TogglePageComponent },
      { view: 'formControl', title: 'Form control', type: FormControlPageComponent },
      { view: 'formFieldHint', title: 'Form field hint', type: FormFieldHintPageComponent },
      { view: 'nativeTextField', title: 'Native Text Field', type: NativeTextFieldPageComponent },
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
