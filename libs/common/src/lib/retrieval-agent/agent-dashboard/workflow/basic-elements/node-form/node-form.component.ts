import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  OnDestroy,
  Output,
  Injector,
  signal,
  computed,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { FormGroup, ReactiveFormsModule, FormArray, FormControl } from '@angular/forms';
import { JSONSchema4 } from 'json-schema';
import { ConfigurationFormComponent } from '../configuration-form/configuration-form.component';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { FormDirective } from '../form.directive';
import { ARAGSchemas } from '@nuclia/core';
import { FieldConfigService, FieldConfig } from './field-config.service';
import { FieldRendererComponent } from './field-renderer';

export interface RenderableField {
  key: string;
  label: string;
  property: JSONSchema4;
  config: FieldConfig;
  required: boolean;
}

@Component({
  selector: 'app-node-form',
  templateUrl: './node-form.component.html',
  styleUrls: ['./node-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule, ConfigurationFormComponent, CommonModule, FieldRendererComponent],
})
export class NodeFormComponent extends FormDirective implements OnInit, OnDestroy {
  @Input() agentType!: keyof ARAGSchemas['agents'];
  @Input() agentName!: string;
  @Input() formGroupName!: string;

  // Optional inputs for recursive/nested usage
  @Input() parentForm?: FormGroup; // When used as a nested component
  @Input() nestedSchema?: JSONSchema4; // When rendering a specific sub-schema
  @Input() isNested?: boolean = false; // Flag to indicate nested usage
  @Input() schemas?: ARAGSchemas | null; // Provide schemas directly to avoid circular dependency

  @Output() formReady = new EventEmitter<FormGroup>();

  override form: FormGroup<any> = new FormGroup({
    [this.formGroupName as unknown as string]: new FormGroup({}),
  });

  isFormReady = false;
  schema: JSONSchema4 = {};
  renderableFields: RenderableField[] = [];

  // Signal to track form validation state changes
  private formValidationTrigger = signal(0);

  // Subscriptions to clean up on destroy
  private subscriptions = new Subscription();

  // Computed property to determine if submit should be disabled
  isSubmitDisabled = computed(() => {
    // Access the trigger to make this reactive
    this.formValidationTrigger();

    if (!this.configForm) {
      return true;
    }

    // Check if form has actual validation errors or is just empty
    const hasValidationErrors = this.hasActualValidationErrors();
    const allRequiredFieldsPopulated = this.areAllRequiredFieldsPopulated();

    // Enhanced logic: Allow save if:
    // 1. Form has no actual validation errors AND
    // 2. All required fields are populated (even with defaults)
    if (hasValidationErrors) {
      return true;
    }

    if (!allRequiredFieldsPopulated) {
      return true;
    }

    return false;
  });

  // Check if form has actual validation errors (not just empty values)
  private hasActualValidationErrors(): boolean {
    if (!this.configForm) {
      return true;
    }

    // Recursively check all controls for actual validation errors
    return this.checkControlForErrors(this.configForm);
  }

  private checkControlForErrors(control: any): boolean {
    if (control.errors) {
      // Check if errors are meaningful validation errors (not just 'required' for empty forms)
      const errorKeys = Object.keys(control.errors);

      // For now, let's be permissive and only block on certain error types
      const blockingErrors = errorKeys.filter(
        (key) => key !== 'required' || (control.value !== null && control.value !== undefined && control.value !== ''),
      );

      if (blockingErrors.length > 0) {
        return true;
      }
    }

    // Check child controls
    if (control.controls) {
      for (const childControl of Object.values(control.controls)) {
        if (this.checkControlForErrors(childControl)) {
          return true;
        }
      }
    }

    return false;
  }

  ngOnInit() {
    if (this.isNested && this.nestedSchema && this.parentForm) {
      // When used as nested component, use provided schema and parent form
      this.schema = this.nestedSchema;
      this.form = this.parentForm;
      this.setupRenderableFields();
      this.isFormReady = true;
      this.formReady.emit(this.configForm);
      this.setupFormValidationListener();
    } else if (this.schemas) {
      const formConfig = this.buildFormFromSchema(this.schemas, this.agentType, this.agentName);
      this.schema = formConfig.schema || {};
      this.form = new FormGroup({
        [this.formGroupName as unknown as string]: formConfig.formGroup,
      });
      this.setupRenderableFields();

      // Emit the configForm (nested form group) not the root form
      this.formReady.emit(this.configForm);
      this.isFormReady = true;
      this.setupFormValidationListener();

      // Trigger initial validation check to handle forms with default values
      this.formValidationTrigger.update((val) => val + 1);
    } else {
      console.warn('NodeFormComponent: No schemas provided and not in nested mode');
    }
  } // Getter for the config form
  override get configForm(): FormGroup {
    return this.form.controls[this.formGroupName] as FormGroup;
  }

  // Setup renderable fields from schema
  private setupRenderableFields(): void {
    if (!this.schema.properties) {
      this.renderableFields = [];
      return;
    }

    const requiredFields = new Set(
      this.schema.required && Array.isArray(this.schema.required) ? this.schema.required : [],
    );

    this.renderableFields = Object.entries(this.schema.properties)
      .filter(([key, property]) => !this.fieldConfigService.isFieldIgnored(key, property))
      .map(([key, property]) => {
        const resolvedProperty = this.getPropertySchema(property);
        const config = this.fieldConfigService.getFieldConfig(key, resolvedProperty, this.schema);

        return {
          key,
          label: property.title || key,
          property: resolvedProperty,
          config,
          required: requiredFields.has(key),
        };
      });
  }

  // Get the actual schema for a property (resolving anyOf and $refs)
  private getPropertySchema(property: any): any {
    if (property.$ref) {
      const resolved = this.resolveRef(property.$ref);
      // Merge the resolved schema with the original property to preserve other attributes like 'default'
      return { ...resolved, ...property, $ref: undefined };
    }
    if (property.anyOf) {
      // Find the first non-null object reference
      const objRef = property.anyOf.find((t: any) => t.$ref);
      if (objRef) {
        const resolved = this.resolveRef(objRef.$ref);
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
  private resolveRef(ref: string): any {
    // Handle #/$defs/SomeName references
    if (ref.startsWith('#/$defs/')) {
      const defName = ref.replace('#/$defs/', '');

      // First try the current schema
      if (this.schema['$defs']?.[defName]) {
        return this.schema['$defs'][defName];
      }

      // If not found and we have access to all schemas, search through them
      if (this.schemas) {
        for (const [agentType, agentSchemas] of Object.entries(this.schemas.agents)) {
          if (Array.isArray(agentSchemas)) {
            for (const schema of agentSchemas) {
              if (schema['$defs']?.[defName]) {
                return schema['$defs'][defName];
              }
            }
          }
        }
      }

      return {};
    }
    return {};
  }

  // Enhanced method to get the root schema with $defs for nested components
  getRootSchemaWithDefs(): JSONSchema4 {
    return this.schema;
  }

  // Helper method to create a nested FormGroup for subform fields
  createNestedFormGroup(property: JSONSchema4): FormGroup {
    const resolvedSchema = this.getPropertySchema(property);

    if (!resolvedSchema.properties) {
      return new FormGroup({});
    }

    const group: { [key: string]: any } = {};

    for (const [propKey, prop] of Object.entries(resolvedSchema.properties)) {
      const property = prop as JSONSchema4;
      let type = property.type;
      let defaultValue = property.default ?? null;

      // Handle anyOf
      if (property.anyOf) {
        const firstType = property.anyOf.find((t: any) => t.type && t.type !== 'null');
        if (firstType) {
          type = firstType.type;
          if (firstType.items) {
            (property as any).items = firstType.items;
          }
        }
      }

      // Create appropriate form controls based on type
      if (this.fieldConfigService.isSubformField(property)) {
        // Nested subform
        group[propKey] = this.createNestedFormGroup(property);
      } else if (type === 'array' || property.items) {
        group[propKey] = new FormArray([]);
      } else if (type === 'boolean') {
        group[propKey] = new FormControl(defaultValue ?? false);
      } else if (type === 'integer') {
        group[propKey] = new FormControl(defaultValue ?? 0);
      } else {
        group[propKey] = new FormControl(defaultValue);
      }
    }

    return new FormGroup(group);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  // Set up listener for form changes to trigger validation updates
  private setupFormValidationListener(): void {
    if (this.configForm) {
      // Listen to both valueChanges and statusChanges to catch validation state changes
      this.subscriptions.add(
        this.configForm.valueChanges.subscribe(() => {
          this.formValidationTrigger.update((val) => val + 1);
        }),
      );

      this.subscriptions.add(
        this.configForm.statusChanges.subscribe(() => {
          this.formValidationTrigger.update((val) => val + 1);
        }),
      );
    }
  }

  // Check if all required fields are populated (even with default values)
  areAllRequiredFieldsPopulated(): boolean {
    if (!this.schema || !this.schema.properties || !this.configForm) {
      return true; // No requirements to check
    }

    const requiredFields = new Set(
      this.schema.required && Array.isArray(this.schema.required) ? this.schema.required : [],
    );

    // If no required fields are defined in the schema, allow submission
    if (requiredFields.size === 0) {
      return true;
    }

    // Check each required field has a non-empty value
    for (const fieldKey of requiredFields) {
      const control = this.configForm.get(fieldKey);
      if (!control) {
        continue; // Field doesn't exist in form, skip
      }

      const value = control.value;

      // Check if field is empty/null/undefined
      if (value === null || value === undefined || value === '') {
        return false;
      }

      // For arrays, check if they have at least one item
      if (Array.isArray(value) && value.length === 0) {
        return false;
      }
    }

    return true;
  }
}
