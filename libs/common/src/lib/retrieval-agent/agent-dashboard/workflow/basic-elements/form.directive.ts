import { Directive, input, output } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { NodeCategory, NodeConfig } from '../workflow.models';
import { ARAGSchemas } from '@nuclia/core';
import { JSONSchema4 } from 'json-schema';

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

  config?: NodeConfig;

  public buildFormFromSchema(
    aragsSchema: ARAGSchemas | null,
    agent: keyof ARAGSchemas['agents'],
    key: string
  ): {
    formGroup: FormGroup;
    schema: JSONSchema4;
  } {
    if (!aragsSchema) {
      return {
        formGroup: new FormGroup({}),
        schema: {} as JSONSchema4
      };
    }

    // Try to find the schema by exact title match
    let schema = (aragsSchema.agents[agent])
      ?.find((s: JSONSchema4) => s.title?.toLowerCase() === key?.toLowerCase());

    // Fallback: some schemas have titles that include the key as a substring
    if (!schema || !schema.properties) {
      schema = (aragsSchema.agents[agent])
        ?.find((s: JSONSchema4) => s.title?.toLowerCase()?.includes(key?.toLowerCase()));
    }

    // Another fallback: some schemas might be identified by $ref containing the key
    if (!schema || !schema.properties) {
      schema = (aragsSchema.agents[agent])
        ?.find((s: JSONSchema4) => s.$ref?.toLowerCase()?.includes(key?.toLowerCase()));
    }

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
        schema: {} as JSONSchema4
      };
    }

    const group: { [key: string]: any } = {};
    for (const [propKey, prop] of Object.entries(schema.properties)) {
      let type = prop.type;
      let defaultValue = prop.default ?? null;

      // Handle anyOf
      if (prop.anyOf) {
        const firstType = prop.anyOf.find((t: any) => t.type && t.type !== 'null');
        if (firstType) {
          type = firstType.type;
          if (firstType.items) {
            prop.items = firstType.items;
          }
        }
      }

      // Prefer config value over default for array fields
      let initialArrayValues: any[] = [];
      if (type === 'array' || prop.items) {
        // If config exists and has a value for this key, use it
        if (this.config && Array.isArray((this.config as any)[propKey])) {
          initialArrayValues = (this.config as any)[propKey];
        } else if (Array.isArray(defaultValue)) {
          initialArrayValues = defaultValue;
        }
        const arr = new FormArray<FormControl<any>>([]);
        initialArrayValues.forEach((val: any) => arr.push(new FormControl(val)));
        group[propKey] = arr;
      } else if (type === 'boolean') {
        group[propKey] = new FormControl(defaultValue ?? false);
      } else if (type === 'integer') {
        group[propKey] = new FormControl(defaultValue ?? 0);
      } else {
        group[propKey] = new FormControl(defaultValue);
      }
    }

    return {
      formGroup: new FormGroup(group),
      schema: schema
    };
  }

  submit() {
    if (this.form.valid) {
      this.submitForm.emit(this.configForm.getRawValue());
    }
  }
}
