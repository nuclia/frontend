import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CheckboxColor, CheckboxSize } from '../checkbox.component';

export interface CheckboxGroupItem {
  label: string;
  value: string;
  helpTips?: string[];
}

@Component({
  selector: 'stf-checkbox-group',
  templateUrl: './checkbox-group.component.html',
  styleUrls: ['./checkbox-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxGroupComponent implements OnInit {
  @Input() checkboxes: CheckboxGroupItem[] = [];
  @Input() selection: string[] = [];
  @Input() type: 'checkbox' | 'radio' = 'checkbox';
  @Input() name?: string;
  @Input() color: CheckboxColor = 'primary';
  @Input() size: CheckboxSize = 'normal';
  @Input() inline: boolean = false;
  @Input() spacing: 'small' | 'normal' = 'normal';
  @Output() selectionChange = new EventEmitter<string[]>();

  constructor(private cd: ChangeDetectorRef) { }

  ngOnInit(): void {
  }

  toggleSelected(value: string, selected: boolean) {
    let newSelected;
    if (selected) {
      newSelected = this.type === 'radio' ? [value] : this.selection.concat([value]);
    }
    else {
      newSelected = this.selection.filter((item) => item !== value);
    }
    this.selectionChange.emit(newSelected);
    this.cd.markForCheck();
  }
}
