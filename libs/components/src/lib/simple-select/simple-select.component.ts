import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

export type SimpleSelectTheme = 'standard' | 'light' | 'gray' | 'bordered';
export interface SimpleSelectOption { 
  key: string;
  value: string;
  icon?: string;
};
@Component({
  selector: 'stf-simple-select',
  templateUrl: './simple-select.component.html',
  styleUrls: ['./simple-select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleSelectComponent implements OnInit {
  @Input() options: SimpleSelectOption[] = [];
  @Input() defaultValue: SimpleSelectOption | null = null;
  @Input() showReset: boolean = false;
  @Input() theme: SimpleSelectTheme = 'standard';
  @Input() allowTwoLines: boolean = false;
  @Output() changeSelected: EventEmitter<SimpleSelectOption> = new EventEmitter<
    SimpleSelectOption
  >();

  @Input() set value(value: string | undefined) {
    if (value !== undefined) {
      this.selectedValue = this.options.find(option => option.key === value);
    }
  }

  isOpen: boolean = false;
  selectedValue: SimpleSelectOption | undefined;

  constructor(private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (this.defaultValue) {
      this.selectedValue = this.defaultValue;
      this.cd.markForCheck();
    }
  }

  toggleOpen() {
    this.isOpen = !this.isOpen;
  }

  setSelectedValue(value: SimpleSelectOption) {
    this.selectedValue = value;
    this.changeSelected.emit(value);
    this.cd.markForCheck();
  }

  reset() {
    this.selectedValue = undefined;
    this.changeSelected.emit(undefined);
    this.cd.markForCheck();
  }
}
