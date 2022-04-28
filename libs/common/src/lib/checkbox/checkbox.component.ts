import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';

export type CheckboxSize = 'normal' | 'small';
export type CheckboxColor = 'primary' | 'dark';

let nextId = 0;
@Component({
  selector: 'stf-checkbox',
  templateUrl: './checkbox.component.html',
  styleUrls: ['./checkbox.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class STFCheckboxComponent implements OnInit {
    @Input() id?: string;
    @Input() type: 'checkbox' | 'radio' = 'checkbox';
    @Input() name?: string;
    @Input() set selected(value: boolean) { this._selected = value; }
    @Output() selectedChange: EventEmitter<boolean> = new EventEmitter();
    @Input() disabled: boolean = false;
    @Input() color: CheckboxColor = 'primary';
    @Input() size: CheckboxSize = 'normal';
    @Input() ariaLabel?: string;
    @Input() customClass: string = '';
    
    _id: string = '';
    _selected: boolean = false;

  constructor(private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    this._id = this.id ? this.id : `field-${this.type}-${nextId++}`;
    this.name = this.name || this._id;
  }

  toggleCheckbox() {
    if (this.type === 'checkbox' || !this._selected) {
        this._selected = !this._selected;
    }
    this.cd.markForCheck();
    this.selectedChange.emit(this._selected);
  }
}
