import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { Label } from '@nuclia/core';

@Component({
  selector: 'app-label',
  templateUrl: './label.component.html',
  styleUrls: ['./label.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelComponent {
  @Input() label: Label | undefined;
  @Input() addNew: boolean = false;

  @Output() labelAdd = new EventEmitter<string>();
  @Output() labelChange = new EventEmitter<Partial<Label>>();
  @Output() labelDelete = new EventEmitter<void>();

  editMode: boolean = false;
  title = new UntypedFormControl([''], [Validators.required]);

  constructor(private cdr: ChangeDetectorRef) {}

  edit() {
    this.title.setValue(this.label?.title);
    this.editMode = true;
    this.cdr.markForCheck();
  }

  close() {
    this.editMode = false;
    this.cdr.markForCheck();
  }

  delete() {
    this.labelDelete.emit();
  }

  save() {
    if (this.addNew) {
      this.labelAdd.emit(this.title.value);
    } else {
      this.labelChange.emit({ title: this.title.value });
    }
    this.editMode = false;
    this.cdr.markForCheck();
  }

  preventDragAndDrop($event: MouseEvent) {
    $event.stopPropagation();
  }
}
