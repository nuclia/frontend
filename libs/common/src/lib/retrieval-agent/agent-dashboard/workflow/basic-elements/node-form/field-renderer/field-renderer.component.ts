import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { JSONSchema4 } from 'json-schema';
import { FieldConfig } from '../field-config.service';

import { PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { ExpandableTextareaComponent } from '@nuclia/sistema';
import { RulesFieldComponent } from '../../rules-field/rules-field.component';
import {
  ArrayStringFieldComponent,
  CodeEditorComponent,
  DriverSelectComponent,
  EnumSelectComponent,
  KeyValueFieldComponent,
  SynonymsFieldComponent,
  TransportFieldComponent,
} from '../subcomponents';
import { FilteredSourceSelectComponent } from '../subcomponents/filtered-source-select/filtered-source-select.component';
import { ModelSelectComponent } from '../subcomponents/model-select/model-select.component';
import { SubformFieldComponent } from '../subcomponents/subform-field/subform-field.component';

@Component({
  selector: 'app-field-renderer',
  templateUrl: './field-renderer.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    ArrayStringFieldComponent,
    CodeEditorComponent,
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
  @Input() required = false;
  @Input() config?: any;

  getFieldType(): any {
    return this.fieldConfig.type || 'text';
  }
}
