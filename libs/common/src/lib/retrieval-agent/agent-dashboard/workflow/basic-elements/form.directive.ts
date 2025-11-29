import { Directive, input, output, inject } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { NodeCategory, NodeConfig } from '../workflow.models';
import { JSONSchema4 } from 'json-schema';
import { FieldConfigService } from './node-form/field-config.service';
import { convertNodeTypeToConfigTitle } from '../workflow.utils';

/**
   * FormDirective contains 2 abstract FormGroup and an abstract method, as well as two outputs.
   *  - form is the root to be used in ConfigurationFormComponent
   *  - configForm is a getter of the group containing the controls defined for the configuration of each node.
   * 
   * This way, in the template of the components extending this directive, we can have:
<app-configuration-form
  [form]="form"
  (cancel)="cancel.emit()"
  (triggerSubmit)="submit()">
  <ng-container [formGroup]="configForm">
    <!-- Here the different fields can use formControlName attribute -->
  </ng-container>
</app-configuration-form>
   * 
   * <app-configuration-form> is managing the form layout and footer with cancel and submit buttons, 
   * while in <ng-container [formGroup]="configForm"> we have the differents fields controlled directly by the components extending the directive.
   * 
   * This directive also allows us to build and manage the forms directly from the WorkflowService.
   */
@Directive({})
export abstract class FormDirective {
  abstract form: FormGroup;
  abstract configForm: FormGroup;

  category = input.required<NodeCategory>();
  submitForm = output<NodeConfig>();
  cancel = output<void>();

  protected fieldConfigService = inject(FieldConfigService);

  config?: NodeConfig;

  public buildFormFromSchema(
    aragsSchema: JSONSchema4 | null,
    key: string,
  ): {
    formGroup: FormGroup;
    schema: JSONSchema4;
  } {
    if (!aragsSchema) {
      return {
        formGroup: new FormGroup({}),
        schema: {} as JSONSchema4,
      };
    }

    const schemaTitle = convertNodeTypeToConfigTitle(key, aragsSchema);
    let schema = aragsSchema['$defs'][schemaTitle];

    // If schema has $ref, resolve it from $defs
    if (schema && schema.$ref && schema['$defs']) {
      // $ref format: '#/$defs/PreprocessConditionalAgentConfig'
      const refMatch = schema.$ref.match(/#\/\$defs\/(.+)/);
      if (refMatch) {
        const refName = refMatch[1];
        const defSchema = schema['$defs'][refName];
        if (defSchema && defSchema.properties) {
          schema = defSchema;
        }
      }
    }

    // If still not found, return empty form
    if (!schema || !schema.properties) {
      return {
        formGroup: new FormGroup({}),
        schema: {} as JSONSchema4,
      };
    }

    const group: { [key: string]: any } = {};
    for (const [propKey, prop] of Object.entries(schema.properties)) {
      const property = prop as JSONSchema4;
      const resolvedProperty = this.resolvePropertyForFormCreation(property, schema);
      let type = resolvedProperty.type;
      let defaultValue = resolvedProperty.default ?? null;

      // Handle anyOf
      if (resolvedProperty.anyOf) {
        const firstType = resolvedProperty.anyOf.find((t: any) => t.type && t.type !== 'null');
        if (firstType) {
          type = firstType.type;
          if (firstType.items) {
            (resolvedProperty as any).items = firstType.items;
          }
        }
      }

      // Check if this field should be a multiselect (has additionalProps.multiselect)
      const fieldConfig = this.fieldConfigService.getFieldConfig(propKey, resolvedProperty, schema);
      const isMultiselect = fieldConfig.additionalProps?.['multiselect'] === true;

      // Check if this is a subform field (contains $ref)
      if (this.fieldConfigService.isSubformField(property, aragsSchema || schema)) {
        // Create a nested FormGroup for subform fields
        group[propKey] = this.createNestedFormGroupForRef(property, aragsSchema || schema);
      } else if (type === 'array' || property.items || isMultiselect) {
        // Prefer config value over default for array fields
        let initialArrayValues: any[] = [];
        // If config exists and has a value for this key, use it
        if (this.config && (this.config as any)[propKey] !== undefined) {
          const configValue = (this.config as any)[propKey];
          if (Array.isArray(configValue)) {
            initialArrayValues = configValue;
          } else if (typeof configValue === 'string' && isMultiselect) {
            // For multiselect fields, convert comma-separated string to array
            initialArrayValues = configValue
              ? configValue
                  .split(',')
                  .map((v) => v.trim())
                  .filter((v) => v)
              : [];
          }
        } else if (Array.isArray(defaultValue)) {
          initialArrayValues = defaultValue;
        }
        const arr = new FormArray<FormControl<any>>([]);
        initialArrayValues.forEach((val: any) => arr.push(new FormControl(val)));
        group[propKey] = arr;
      } else if (type === 'boolean') {
        group[propKey] = new FormControl(defaultValue ?? false);
      } else if (type === 'integer') {
        group[propKey] = new FormControl(defaultValue ?? null);
      } else {
        group[propKey] = new FormControl(defaultValue);
      }
    }

    return {
      formGroup: new FormGroup(group),
      schema: schema,
    };
  }

  private createNestedFormGroupForRef(property: JSONSchema4, rootSchema: JSONSchema4): FormGroup {
    // Get the $ref from the property
    let refPath: string | null = null;
    if (property.$ref) {
      refPath = property.$ref;
    } else if (property.anyOf) {
      const refObj = property.anyOf.find((item: any) => item.$ref);
      if (refObj && refObj.$ref) {
        refPath = refObj.$ref;
      }
    }

    if (!refPath || !refPath.startsWith('#/$defs/')) {
      return new FormGroup({});
    }

    // Resolve the reference
    const defName = refPath.replace('#/$defs/', '');
    const resolvedSchema = rootSchema['$defs']?.[defName] as JSONSchema4;

    if (!resolvedSchema || !resolvedSchema.properties) {
      return new FormGroup({});
    }

    // Create form controls for the resolved schema
    const nestedGroup: { [key: string]: any } = {};
    for (const [propKey, prop] of Object.entries(resolvedSchema.properties)) {
      const nestedProperty = prop as JSONSchema4;
      let type = nestedProperty.type;
      let defaultValue = nestedProperty.default ?? null;

      // Handle anyOf
      if (nestedProperty.anyOf) {
        const firstType = nestedProperty.anyOf.find((t: any) => t.type && t.type !== 'null');
        if (firstType) {
          type = firstType.type;
        }
      }

      // Check for nested subforms
      if (this.fieldConfigService.isSubformField(nestedProperty, rootSchema)) {
        nestedGroup[propKey] = this.createNestedFormGroupForRef(nestedProperty, rootSchema);
      } else if (type === 'array') {
        nestedGroup[propKey] = new FormArray([]);
      } else if (type === 'boolean') {
        nestedGroup[propKey] = new FormControl(defaultValue ?? false);
      } else if (type === 'integer') {
        nestedGroup[propKey] = new FormControl(defaultValue ?? null);
      } else {
        nestedGroup[propKey] = new FormControl(defaultValue);
      }
    }

    return new FormGroup(nestedGroup);
  }

  // Resolve $ref properties to get correct default values and types
  private resolvePropertyForFormCreation(property: JSONSchema4, schema: JSONSchema4): JSONSchema4 {
    if (property.$ref) {
      const resolved = this.resolveRefInFormDirective(property.$ref, schema);
      // Merge the resolved schema with the original property to preserve other attributes like 'default'
      return { ...resolved, ...property, $ref: undefined };
    }
    if (property.anyOf) {
      // Find the first non-null object reference
      const objRef = property.anyOf.find((t: any) => t.$ref);
      if (objRef && objRef.$ref) {
        const resolved = this.resolveRefInFormDirective(objRef.$ref, schema);
        // Merge resolved schema with original property
        return { ...resolved, ...property, anyOf: undefined };
      }
      // Or return the first non-null type
      const typeObj = property.anyOf.find((t: any) => t.type && t.type !== 'null');
      return typeObj || property;
    }
    return property;
  }

  // Resolve $ref references to their actual schema definitions
  private resolveRefInFormDirective(ref: string, schema: JSONSchema4): any {
    // Handle #/$defs/SomeName references
    if (ref.startsWith('#/$defs/')) {
      const defName = ref.replace('#/$defs/', '');
      return schema['$defs']?.[defName] || {};
    }
    return {};
  }

  protected processFormValue(formValue: any) {
    // Process FormArray values to ensure clean arrays
    const processedValue = { ...formValue };

    for (const [key, value] of Object.entries(rawValue)) {
      if (Array.isArray(value)) {
        // Check if this field is configured as FormArray
        const control = this.configForm.get(key);
        if (control instanceof FormArray) {
          // Keep as array, but filter out empty values
          processedValue[key] = value.filter((v: any) => v !== null && v !== undefined && String(v).trim() !== '');
        }
      } else if (typeof value === 'string' && value === 'null') {
        processedValue[key] = null;
      }
    }
    for (const [key, value] of Object.entries(formValue)) {
      if (Array.isArray(value)) {
        // Check if this field is configured as FormArray
        const control = this.configForm.get(key);
        if (control instanceof FormArray) {
          // Keep as array, but filter out empty values
          processedValue[key] = value.filter((v: any) => v !== null && v !== undefined && String(v).trim() !== '');
        }
      }
    }

    // Remove null id fields from the submitted data
    if (processedValue.id === null) {
      delete processedValue.id;
    }
    return processedValue;
  }

  submit() {
    if (this.form.valid) {
      const processedValue = this.processFormValue(this.configForm.getRawValue());
      this.submitForm.emit(processedValue);
    }
  }
}
