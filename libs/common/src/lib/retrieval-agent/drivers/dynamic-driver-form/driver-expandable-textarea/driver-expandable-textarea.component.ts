import { Component, Input } from '@angular/core';

import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ExpandableTextareaComponent } from '@nuclia/sistema';

@Component({
  selector: 'driver-expandable-textarea',
  standalone: true,
  imports: [ReactiveFormsModule, ExpandableTextareaComponent],
  template: `
    <div [formGroup]="form">
      <nsi-expandable-textarea
        [id]="controlName"
        [formControlName]="controlName"
        [rows]="rows"
        [resizable]="resizable"
        [modalTitle]="label"
        [placeholder]="placeholder"
        [required]="required">
        {{ label }}
        @if (required) {
          <span style="color: red">*</span>
        }
      </nsi-expandable-textarea>
    </div>
  `,
})
export class DriverExpandableTextareaComponent {
  @Input() controlName!: string;
  @Input() form!: FormGroup;
  @Input() label!: string;
  @Input() required: boolean = false;
  @Input() placeholder = '';
  @Input() rows = 3;
  @Input() resizable = false;
}
