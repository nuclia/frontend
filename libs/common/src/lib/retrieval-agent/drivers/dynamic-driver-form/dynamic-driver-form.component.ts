import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule, FormArray, FormControl } from '@angular/forms';
import { JSONSchema4 } from 'json-schema';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { ARAGSchemas, Driver, DriverCreation } from '@nuclia/core';
import { DriverFieldConfigService, DriverFieldConfig } from './driver-field-config.service';
import { DriverFieldRendererComponent } from './driver-field-renderer/driver-field-renderer.component';
import { DriverSubformFieldComponent } from './driver-subform-field/driver-subform-field.component';
import { DriversService } from '../drivers.service';

export interface RenderableDriverField {
  key: string;
  label: string;
  property: JSONSchema4;
  config: DriverFieldConfig;
  required: boolean;
}

@Component({
  selector: 'app-dynamic-driver-form',
  templateUrl: './dynamic-driver-form.component.html',
  styleUrls: ['./dynamic-driver-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule, CommonModule, DriverFieldRendererComponent],
})
export class DynamicDriverFormComponent implements OnInit {
  @Input() driverTitle!: string; // Title from the driver schema (e.g. "BraveDriverConfig")
  @Input() existingDriver?: Driver; // For editing mode
  @Input() existingDrivers?: Driver[]; // For validation

  @Output() formReady = new EventEmitter<FormGroup>();
  @Output() formValid = new EventEmitter<boolean>();

  private fieldConfigService = inject(DriverFieldConfigService);
  private driversService = inject(DriversService);

  // Special field component overrides for dynamic form
  private readonly specialFieldComponentOverrides: Record<string, DriverFieldConfig> = {
    headers: { component: 'api-headers-field', type: 'object' },
    env: { component: 'key-value-field', type: 'object' },
    args: { component: 'array-string-field', type: 'array' },
    // Add more overrides here as needed
  };

  form: FormGroup = new FormGroup({});
  isFormReady = signal(false);
  schema: JSONSchema4 = {};
  renderableFields: RenderableDriverField[] = [];

  /**
   * Get field configuration with special overrides support
   */
  private getFieldConfigWithOverrides(key: string, property: JSONSchema4, schema?: JSONSchema4): DriverFieldConfig {
    // Check for special field overrides first
    if (this.specialFieldComponentOverrides[key]) {
      const override = { ...this.specialFieldComponentOverrides[key], customKey: key };
      return override;
    }

    // Also check by property title (case-insensitive)
    if (property.title) {
      const titleKey = property.title.toLowerCase().replace(/\s+/g, '');
      if (this.specialFieldComponentOverrides[titleKey]) {
        const override = { ...this.specialFieldComponentOverrides[titleKey], customKey: key };
        return override;
      }
    }

    // Fallback to service configuration
    return this.fieldConfigService.getFieldConfig(key, property, schema);
  }

  ngOnInit() {
    this.setupForm();
  }

  private setupForm(): void {
    // Get schemas from the service
    const schemas = this.driversService.schemas();

    // Check if schemas is available
    if (!schemas || !schemas.drivers) {
      console.error('Schemas not available or drivers array missing');
      return;
    }

    // Find the driver schema by title
    const driverSchema = schemas.drivers.find((driver) => driver.title === this.driverTitle) as JSONSchema4;

    if (!driverSchema) {
      console.error(`Driver schema not found for title: ${this.driverTitle}`);
      return;
    }

    this.schema = driverSchema;
    this.form = this.buildFormFromSchema(driverSchema);
    this.setupRenderableFields();

    // Validate form structure before marking as ready
    this.validateFormStructure();

    this.isFormReady.set(true);
    this.formReady.emit(this.form);

    // Watch form validity
    this.form.statusChanges.subscribe((status) => {
      this.formValid.emit(status === 'VALID');
    });

    // Initialize with existing driver data if editing
    if (this.existingDriver) {
      this.populateFormWithExistingData();
    }
  }

  private buildFormFromSchema(schema: JSONSchema4): FormGroup {
    if (!schema.properties) {
      return new FormGroup({});
    }

    const group: { [key: string]: any } = {};

    for (const [key, prop] of Object.entries(schema.properties)) {
      const property = prop as JSONSchema4;
      const resolvedProperty = this.getPropertySchema(property);

      // Skip ignored fields
      if (this.fieldConfigService.isFieldIgnored(key, resolvedProperty)) {
        continue;
      }

      group[key] = this.createFormControl(key, resolvedProperty);
    }

    return new FormGroup(group);
  }

  private createFormControl(key: string, property: JSONSchema4): any {
    const config = this.getFieldConfigWithOverrides(key, property, this.schema);
    let type = property.type;
    let defaultValue = property.default ?? null;

    // Special handling for const fields - set value to the const value
    if (property['const'] !== undefined) {
      defaultValue = property['const'];
    }

    // Special handling for config field - resolve $ref to get actual schema
    if (key === 'config' && property.$ref) {
      const resolvedProperty = this.getPropertySchema(property);
      return this.createNestedFormGroup(resolvedProperty);
    }

    // Handle anyOf
    if (property.anyOf) {
      const firstType = property.anyOf.find((t: any) => t.type && t.type !== 'null');
      if (firstType) {
        type = firstType.type;
        defaultValue = firstType.default ?? defaultValue;

        // Check for const in anyOf
        if (firstType['const'] !== undefined) {
          defaultValue = firstType['const'];
        }
      }
    }

    // Create appropriate form controls based on type
    if (config.type === 'subform') {
      // Nested subform
      return this.createNestedFormGroup(property);
    } else if (type === 'object' && property.additionalProperties) {
      // Object with additionalProperties should be a FormGroup for key-value pairs
      return new FormGroup({});
    } else if (type === 'array' || property.items) {
      return new FormArray([]);
    } else if (type === 'boolean') {
      return new FormControl(defaultValue ?? false);
    } else if (type === 'integer' || type === 'number') {
      return new FormControl(defaultValue ?? 0);
    } else {
      return new FormControl(defaultValue);
    }
  }

  private createNestedFormGroup(property: JSONSchema4): FormGroup {
    let resolvedSchema = this.getPropertySchema(property);

    // For properties with $ref (like config), resolve the reference
    if (property.$ref) {
      resolvedSchema = this.resolveRef(property.$ref);
    }

    if (!resolvedSchema.properties) {
      console.warn('No properties found in resolved schema for nested form group:', resolvedSchema);
      return new FormGroup({});
    }

    const group: { [key: string]: any } = {};

    for (const [propKey, prop] of Object.entries(resolvedSchema.properties)) {
      const nestedProperty = prop as JSONSchema4;

      // Skip ignored fields
      if (this.fieldConfigService.isFieldIgnored(propKey, nestedProperty)) {
        continue;
      }

      // Apply our overrides for nested fields too
      const nestedConfig = this.getFieldConfigWithOverrides(propKey, nestedProperty, this.schema);

      group[propKey] = this.createFormControl(propKey, nestedProperty);
    }

    const formGroup = new FormGroup(group);

    // Validate that all controls are properly initialized
    Object.entries(formGroup.controls).forEach(([key, control]) => {
      if (!control) {
        console.error(`Form control ${key} is null or undefined in nested form group`);
      }
    });

    return formGroup;
  }

  /**
   * Validate that the form structure is correct and all expected controls exist
   */
  private validateFormStructure(): void {
    // Check main form
    if (!this.form) {
      console.error('Main form is not initialized');
      return;
    }

    // Check each control
    Object.entries(this.form.controls).forEach(([key, control]) => {
      if (!control) {
        console.error(`Form control '${key}' is null or undefined`);
      } else if (control instanceof FormGroup) {
        // Validate nested controls
        Object.entries(control.controls).forEach(([nestedKey, nestedControl]) => {
          if (!nestedControl) {
            console.error(`Nested form control '${key}.${nestedKey}' is null or undefined`);
          }
        });
      }
    });
  }

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
        let resolvedProperty = this.getPropertySchema(property);

        // Special handling for config field - ensure we have the resolved schema
        if (key === 'config' && property.$ref) {
          resolvedProperty = this.resolveRef(property.$ref);
        }

        const config = this.getFieldConfigWithOverrides(key, resolvedProperty, this.schema);

        return {
          key,
          label: property.title || this.formatFieldLabel(key),
          property: resolvedProperty,
          config,
          required: requiredFields.has(key),
        };
      });
  }

  private formatFieldLabel(key: string): string {
    // Convert camelCase or snake_case to Title Case
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  private populateFormWithExistingData(): void {
    if (!this.existingDriver) return;

    // Populate form with existing driver data
    Object.keys(this.form.controls).forEach((key) => {
      if (this.existingDriver && key in this.existingDriver) {
        const control = this.form.get(key);
        if (control) {
          control.setValue((this.existingDriver as any)[key]);
        }
      }
    });

    // Handle nested config object if it exists
    if (this.existingDriver.config && this.form.get('config')) {
      const configControl = this.form.get('config') as FormGroup;
      Object.keys(configControl.controls).forEach((configKey) => {
        if (this.existingDriver?.config && configKey in this.existingDriver.config) {
          const control = configControl.get(configKey);
          if (control && this.existingDriver?.config) {
            control.setValue((this.existingDriver.config as any)[configKey]);
          }
        }
      });
    }
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

      // If not found, search through all driver schemas from the service
      const schemas = this.driversService.schemas();
      if (schemas?.drivers) {
        for (const driverSchema of schemas.drivers) {
          if (driverSchema['$defs']?.[defName]) {
            return driverSchema['$defs'][defName];
          }
        }
      }

      console.warn(`Could not resolve $ref: ${ref} (looking for ${defName})`);
      return {};
    }
    return {};
  }

  /**
   * Get the form value as a DriverCreation object
   */
  getFormValue(): DriverCreation {
    const formValue = this.form.value;

    // If editing, preserve the id
    if (this.existingDriver?.id) {
      return {
        ...formValue,
        id: this.existingDriver.id,
      };
    }

    return formValue;
  }

  /**
   * Check if form is valid
   */
  isValid(): boolean {
    return this.form.valid;
  }

  /**
   * Mark all fields as touched to show validation errors
   */
  markAllAsTouched(): void {
    this.form.markAllAsTouched();
  }
}
