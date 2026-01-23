import { Component, Input, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { JSONSchema4 } from 'json-schema';
import { CommonModule } from '@angular/common';
import { FieldConfigService, FieldConfig } from '../../field-config.service';
import { PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import {
  ArrayStringFieldComponent,
  CodeEditorComponent,
  DriverSelectComponent,
  EnumSelectComponent,
  TransportFieldComponent,
} from '../';
import { ModelSelectComponent } from '../model-select/model-select.component';
import { FilteredSourceSelectComponent } from '../filtered-source-select/filtered-source-select.component';
import { RulesFieldComponent } from '../../../rules-field/rules-field.component';

export interface RenderableField {
  key: string;
  label: string;
  property: JSONSchema4;
  config: FieldConfig;
  required: boolean;
}

@Component({
  selector: 'app-subform-field',
  templateUrl: './subform-field.component.html',
  styleUrls: ['./subform-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PaTextFieldModule,
    PaTogglesModule,
    ModelSelectComponent,
    DriverSelectComponent,
    ArrayStringFieldComponent,
    CodeEditorComponent,
    EnumSelectComponent,
    FilteredSourceSelectComponent,
    RulesFieldComponent,
    TransportFieldComponent,
  ],
})
export class SubformFieldComponent implements OnInit {
  @Input() form!: FormGroup;
  @Input() controlName!: string;
  @Input() label!: string;
  @Input() property!: JSONSchema4;
  @Input() required: boolean = false;

  private fieldConfigService = inject(FieldConfigService);

  renderableFields: RenderableField[] = [];

  ngOnInit() {
    this.setupRenderableFields();
  }

  private setupRenderableFields(): void {
    if (!this.property.properties) {
      this.renderableFields = [];
      return;
    }

    this.renderableFields = Object.entries(this.property.properties)
      .filter(([key, property]) => !this.fieldConfigService.isFieldIgnored(key, property))
      .map(([key, property]) => {
        const resolvedProperty = this.getPropertySchema(property);
        const config = this.fieldConfigService.getFieldConfig(key, resolvedProperty);

        return {
          key,
          label: property.title || key,
          property: resolvedProperty,
          config,
          required: false,
        };
      });
  }

  // Get the actual schema for a property (resolving anyOf)
  private getPropertySchema(property: any): any {
    if (property.$ref) {
      console.error('Cannot handle 2-depth nesting');
      return property;
    }
    if (property.anyOf) {
      // Find the first non-null object reference
      const objRef = property.anyOf.find((t: any) => t.$ref);
      if (objRef) {
        console.error('Cannot handle 2-depth nesting');
        return property;
      }
      // Or return the first non-null type
      const typeObj = property.anyOf.find((t: any) => t.type && t.type !== 'null');
      return typeObj || property;
    }
    return property;
  }

  get subFormGroup(): FormGroup {
    return this.form.get(this.controlName) as FormGroup;
  }

  getFieldType(field: RenderableField): any {
    return field.config.type || 'text';
  }

  onSubformReady(subform: FormGroup) {
    // The subform is ready, we can perform any additional setup if needed
    console.log('Subform ready for control:', this.controlName, subform);
  }
}
