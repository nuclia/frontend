import {
  Component,
  Input,
  OnInit,
  inject,
  ChangeDetectionStrategy,
  signal,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { JSONSchema4, JSONSchema7 } from 'json-schema';

import { DriverFieldConfigService, DriverFieldConfig } from '../driver-field-config.service';
import { DriversService } from '../../drivers.service';
import { PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { ApiHeadersFieldComponent } from '../api-headers-field/api-headers-field.component';
import { KeyValueFieldComponent } from '../key-value-field/key-value-field.component';
import { DriverExpandableTextareaComponent } from '../driver-expandable-textarea/driver-expandable-textarea.component';
import { ArrayStringFieldComponent } from '../../../agent-dashboard/workflow';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';

export interface RenderableDriverSubfield {
  key: string;
  label: string;
  property: JSONSchema4;
  config: DriverFieldConfig;
  required: boolean;
}

@Component({
  selector: 'app-driver-subform-field',
  templateUrl: './driver-subform-field.component.html',
  styleUrls: ['./driver-subform-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ArrayStringFieldComponent,
    ReactiveFormsModule,
    PaTextFieldModule,
    PaTogglesModule,
    ApiHeadersFieldComponent,
    KeyValueFieldComponent,
    DriverExpandableTextareaComponent
],
})
export class DriverSubformFieldComponent implements OnInit, OnDestroy {
  @Input() form!: FormGroup;
  @Input() controlName!: string;
  @Input() label!: string;
  @Input() property!: JSONSchema4;
  @Input() required: boolean = false;
  @Input() rootSchema?: JSONSchema4; // The root driver schema containing $defs

  private fieldConfigService = inject(DriverFieldConfigService);
  private driversService = inject(DriversService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  // Special field component overrides for subform fields
  private readonly specialFieldComponentOverrides: Record<string, DriverFieldConfig> = {
    headers: { component: 'api-headers-field', type: 'object' },
    env: { component: 'key-value-field', type: 'object' },
    args: { component: 'array-string-field', type: 'array' },
    // Add more overrides here as needed
  };

  resolvedSchema = signal<JSONSchema4 | null>(null);
  renderableFields = signal<RenderableDriverSubfield[]>([]);
  isLoading = signal(true);

  /**
   * Get field configuration with special overrides support for subform fields
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

    // Auto-detect object types with additionalProperties for key-value fields
    if (property.type === 'object' && property.additionalProperties) {
      return { component: 'key-value-field', type: 'object', customKey: key };
    }

    // Fallback to service configuration
    return this.fieldConfigService.getFieldConfig(key, property, schema);
  }

  ngOnInit() {
    this.resolveSchema();

    // Subscribe to form value changes to detect when controls are added/removed
    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      // Trigger change detection to ensure template updates when form controls change
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private resolveSchema() {
    if (!this.property) {
      this.isLoading.set(false);
      return;
    }

    let refPath: string | null = null;

    // Get the $ref from the property
    if (this.property.$ref) {
      refPath = this.property.$ref;
    } else if (this.property.anyOf) {
      const refObj = this.property.anyOf.find((item: any) => item.$ref);
      if (refObj && refObj.$ref) {
        refPath = refObj.$ref;
      }
    }

    if (refPath && refPath.startsWith('#/$defs/')) {
      const defName = refPath.replace('#/$defs/', '');
      const resolved = this.resolveRefFromAllSchemas(defName);

      if (resolved) {
        this.resolvedSchema.set(resolved as JSONSchema4);
        this.setupRenderableFields();
      } else {
        console.error(`Could not resolve driver subform reference: ${refPath} (${defName})`);
      }
    } else {
      // If no $ref, use the property as-is
      this.resolvedSchema.set(this.property);
      this.setupRenderableFields();
    }

    this.isLoading.set(false);
  }

  private resolveRefFromAllSchemas(defName: string): JSONSchema4 | null {
    // First try the root schema if provided
    if (this.rootSchema && this.rootSchema['$defs']?.[defName]) {
      return this.rootSchema['$defs'][defName] as JSONSchema4;
    }

    // Search through all driver schemas from the service
    const schemas = this.driversService.schemas();
    const schema = (schemas as JSONSchema7).$defs?.[defName];
    if (schema) {
      return schema as JSONSchema4;
    } else {
      console.warn(`Could not find definition for ${defName} in any driver schema`);
      return null;
    }
  }

  private setupRenderableFields(): void {
    const resolvedSchema = this.resolvedSchema();
    if (!resolvedSchema?.properties) {
      this.renderableFields.set([]);
      return;
    }

    const requiredFields = new Set(
      resolvedSchema.required && Array.isArray(resolvedSchema.required) ? resolvedSchema.required : [],
    );

    const fields = Object.entries(resolvedSchema.properties)
      .filter(([key, property]) => !this.fieldConfigService.isFieldIgnored(key, property))
      .map(([key, property]) => {
        const resolvedProperty = this.getPropertySchema(property);
        const config = this.getFieldConfigWithOverrides(key, resolvedProperty, resolvedSchema);

        return {
          key,
          label: property.title || this.formatFieldLabel(key),
          property: resolvedProperty,
          config,
          required: requiredFields.has(key),
        };
      });

    this.renderableFields.set(fields);

    // Trigger change detection after setting up fields
    this.cdr.markForCheck();
  }

  private getPropertySchema(property: any): any {
    if (property.$ref) {
      const refName = property.$ref.replace('#/$defs/', '');
      const resolved = this.resolveRefFromAllSchemas(refName);
      return resolved ? { ...resolved, ...property, $ref: undefined } : property;
    }

    if (property.anyOf) {
      const objRef = property.anyOf.find((t: any) => t.$ref);
      if (objRef) {
        const refName = objRef.$ref.replace('#/$defs/', '');
        const resolved = this.resolveRefFromAllSchemas(refName);
        return resolved ? { ...resolved, ...property, anyOf: undefined } : property;
      }

      const typeObj = property.anyOf.find((t: any) => t.type && t.type !== 'null');
      if (typeObj) {
        return { ...property, ...typeObj, anyOf: undefined };
      }
      return property;
    }

    return property;
  }

  private formatFieldLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  getSubform(): FormGroup | null {
    const subform = this.form.get(this.controlName) as FormGroup;
    // Return null if subform is not properly initialized to prevent binding errors
    if (!subform || !(subform instanceof FormGroup)) {
      console.warn(`Subform ${this.controlName} is not properly initialized`);
      return null;
    }

    return subform;
  }

  /**
   * Get a specific form control from the subform
   */
  getFormControl(fieldKey: string) {
    const subform = this.getSubform();
    if (!subform) {
      console.warn(`Cannot get form control ${fieldKey}: subform is not initialized`);
      return null;
    }

    const control = subform.get(fieldKey);
    if (!control) {
      console.warn(`Form control ${fieldKey} not found in subform ${this.controlName}`);
      return null;
    }

    return control;
  }

  getSafeFormControl(fieldKey: string): any {
    return this.getFormControl(fieldKey) || new FormControl('');
  }

  getSafeSubform(): FormGroup {
    return this.getSubform() || new FormGroup({});
  } /**
   * Check if a specific form control exists and is properly initialized
   */
  hasFormControl(fieldKey: string): boolean {
    const subform = this.getSubform();
    if (!subform) return false;

    const control = subform.get(fieldKey);
    const hasControl = control !== null && control !== undefined;
    return hasControl;
  }
}
