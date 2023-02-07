import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Label } from '@nuclia/core';
import { coerceBooleanProperty } from '@angular/cdk/coercion';

@Component({
  selector: 'app-label',
  templateUrl: './label.component.html',
  styleUrls: ['./label.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelComponent {
  @Input()
  set label(value: Label | undefined) {
    this._label = value;
    if (value) {
      this.title.setValue(value.title);
    }
  }
  get label() {
    return this._label;
  }

  @Input()
  set noHandle(value: any) {
    this._noHandle = coerceBooleanProperty(value);
  }
  get noHandle() {
    return this._noHandle;
  }

  @Output() titleChange = new EventEmitter<string>();
  @Output() deleteLabel = new EventEmitter<void>();

  title = new FormControl<string>('', { validators: [Validators.required], nonNullable: true });

  private _label?: Label;
  private _noHandle = false;

  delete() {
    this.deleteLabel.emit();
  }

  save() {
    this.titleChange.emit(this.title.value);
    if (!this.label) {
      this.title.reset();
    }
  }

  preventDragAndDrop($event: MouseEvent) {
    $event.stopPropagation();
  }
}
