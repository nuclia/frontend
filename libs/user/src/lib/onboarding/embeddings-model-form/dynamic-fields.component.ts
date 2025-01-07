import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LearningConfigurationProperty } from '@nuclia/core';
import { PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'nus-dynamic-fields',
  template: `
    <form
      class="dynamic-fields"
      [formGroup]="form">
      @for (field of fields; track field.key) {
        @switch (field.value.type) {
          @case ('number') {
            <pa-input
              type="number"
              [formControlName]="field.key"
              [help]="field.value.description">
              {{ field.value.title }}
            </pa-input>
          }
          @case ('integer') {
            <pa-input
              type="number"
              step="1"
              [formControlName]="field.key"
              [help]="field.value.description">
              {{ field.value.title }}
            </pa-input>
          }
          @default {
            <pa-input
              [formControlName]="field.key"
              [help]="field.value.description">
              {{ field.value.title }}
            </pa-input>
          }
        }
      }
    </form>
  `,
  styleUrl: './dynamic-fields.component.scss',
  imports: [CommonModule, PaTextFieldModule, ReactiveFormsModule],
})
export class DynamicFieldsComponent {
  @Input() form: FormGroup = new FormGroup({});
  @Input() fields: { key: string; value: LearningConfigurationProperty }[] = [];
}
