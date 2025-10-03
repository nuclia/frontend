import { Component, Input, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { JSONSchema4 } from 'json-schema';
import { CommonModule } from '@angular/common';
import { WorkflowService } from '../../../../workflow.service';
import { ARAGSchemas } from '@nuclia/core';
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
import { McpSourceSelectComponent } from '../mcp-source-select/mcp-source-select.component';
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
    McpSourceSelectComponent,
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
  @Input() rootSchema?: JSONSchema4; // The root schema containing $defs

  private workflowService = inject(WorkflowService);
  private fieldConfigService = inject(FieldConfigService);

  resolvedSchema: JSONSchema4 | null = null;
  schemas: ARAGSchemas | null = null;
  renderableFields: RenderableField[] = [];

  ngOnInit() {
    this.resolveSchema();
  }

  private resolveSchema() {
    if (!this.property) return;

    // Get the schemas from WorkflowService
    this.workflowService.schemas$.subscribe((schemas: ARAGSchemas | null) => {
      if (schemas) {
        this.schemas = schemas;

        // Get the root schema if not provided
        if (!this.rootSchema) {
          // Try to find any schema that contains $defs
          for (const [agentType, agentSchemas] of Object.entries(schemas.agents)) {
            for (const schema of agentSchemas as JSONSchema4[]) {
              if (schema['$defs']) {
                this.rootSchema = schema;
                this.performResolution();
                break;
              }
            }
            if (this.rootSchema) break;
          }
        } else {
          this.performResolution();
        }
      }
    });
  }

  private performResolution() {
    if (!this.rootSchema) return;

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
      const resolved = this.rootSchema['$defs']?.[defName];
      if (resolved) {
        this.resolvedSchema = resolved as JSONSchema4;
        this.setupRenderableFields();
      }
    }
  }

  private setupRenderableFields(): void {
    if (!this.resolvedSchema?.properties) {
      this.renderableFields = [];
      return;
    }

    const requiredFields = new Set(
      this.resolvedSchema.required && Array.isArray(this.resolvedSchema.required) ? this.resolvedSchema.required : [],
    );

    this.renderableFields = Object.entries(this.resolvedSchema.properties)
      .filter(([key, property]) => !this.fieldConfigService.isFieldIgnored(key, property))
      .map(([key, property]) => {
        const resolvedProperty = this.getPropertySchema(property);
        const config = this.fieldConfigService.getFieldConfig(key, resolvedProperty, this.rootSchema);

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
      if (this.rootSchema?.['$defs']?.[defName]) {
        return this.rootSchema['$defs'][defName];
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

  get subFormGroup(): FormGroup {
    return this.form.get(this.controlName) as FormGroup;
  }

  onSubformReady(subform: FormGroup) {
    // The subform is ready, we can perform any additional setup if needed
    console.log('Subform ready for control:', this.controlName, subform);
  }
}
