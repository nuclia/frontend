import { Component, Input, forwardRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { JSONSchema4 } from 'json-schema';
import { FieldConfig } from '../field-config.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import {
  ArrayStringFieldComponent,
  CodeEditorComponent,
  DriverSelectComponent,
  EnumSelectComponent,
  KeyValueFieldComponent,
  SynonymsFieldComponent,
  TransportFieldComponent,
} from '../subcomponents';
import { ModelSelectComponent } from '../subcomponents/model-select/model-select.component';
import { SubformFieldComponent } from '../subcomponents/subform-field/subform-field.component';
import { FilteredSourceSelectComponent } from '../subcomponents/filtered-source-select/filtered-source-select.component';
import { RulesFieldComponent } from '../../rules-field/rules-field.component';
import { ExpandableTextareaComponent } from '@nuclia/sistema';

@Component({
  selector: 'app-field-renderer',
  templateUrl: './field-renderer.component.html',
  standalone: true,
  imports: [
    ArrayStringFieldComponent,
    CodeEditorComponent,
    CommonModule,
    DriverSelectComponent,
    EnumSelectComponent,
    ExpandableTextareaComponent,
    KeyValueFieldComponent,
    SynonymsFieldComponent,
    FilteredSourceSelectComponent,
    ModelSelectComponent,
    PaTextFieldModule,
    PaTogglesModule,
    ReactiveFormsModule,
    RulesFieldComponent,
    SubformFieldComponent,
    TransportFieldComponent,
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

  getFieldType(): any {
    return this.fieldConfig.type || 'text';
  }
}
