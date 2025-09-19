import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { JSONSchema4 } from 'json-schema';
import { FieldConfig } from '../field-config.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import {
  ModelSelectComponent,
  ArrayStringFieldComponent,
  DriverSelectComponent,
  EnumSelectComponent,
} from '../subcomponents';
import { RulesFieldComponent } from '../../rules-field/rules-field.component';

@Component({
  selector: 'app-field-renderer',
  templateUrl: './field-renderer.component.html',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PaTextFieldModule,
    PaTogglesModule,
    ModelSelectComponent,
    DriverSelectComponent,
    ArrayStringFieldComponent,
    EnumSelectComponent,
    RulesFieldComponent,
  ],
})
export class FieldRendererComponent {
  @Input() fieldConfig!: FieldConfig;
  @Input() form!: FormGroup;
  @Input() controlName!: string;
  @Input() label!: string;
  @Input() property!: JSONSchema4;
  @Input() required: boolean = false;
  @Input() config?: any;
}
