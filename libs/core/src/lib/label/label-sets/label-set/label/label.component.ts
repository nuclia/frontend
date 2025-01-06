import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Label } from '@nuclia/core';
import { coerceBooleanProperty } from '@angular/cdk/coercion';

@Component({
  selector: 'app-label',
  templateUrl: './label.component.html',
  styleUrls: ['./label.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class LabelComponent {
  @Input()
  set label(value: Label | undefined) {
    this._label = value;
    if (value) {
      this.title.setValue(value.title);
      this._titleBackup = value.title;
    }
  }
  get label() {
    return this._label;
  }

  @Input()
  set existingTitles(value: string[] | undefined) {
    if (value) {
      this._existingTitles = value;
    }
  }
  get existingTitles(): string[] {
    return this._existingTitles;
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
  errorMessage = '';

  private _label?: Label;
  private _noHandle = false;
  private _existingTitles: string[] = [];
  private _titleBackup?: string;

  delete() {
    this.deleteLabel.emit();
  }

  save() {
    if (!this.title.value || (this._titleBackup && this.title.value === this._titleBackup)) {
      return;
    }
    if (this.isDuplicatedLabel(this.title.value)) {
      return;
    }
    this.titleChange.emit(this.title.value);
    if (!this.label) {
      this.title.reset();
    }
  }

  private isDuplicatedLabel(title: string): boolean {
    if (this._titleBackup && title === this._titleBackup) {
      return false;
    }
    const isDuplicated = this.existingTitles.includes(title);
    this.errorMessage = isDuplicated ? 'label-set.form.labels.duplicated-name' : '';
    return isDuplicated;
  }
}
