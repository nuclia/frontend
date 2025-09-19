import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { JSONSchema4 } from 'json-schema';
import { ConfigurationFormComponent } from '../configuration-form/configuration-form.component';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { FormDirective } from '../form.directive';
import { WorkflowService } from '../../workflow.service';
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
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    ConfigurationFormComponent,
    CommonModule,
    FieldRendererComponent,
    NodeFormComponent, // Self-reference for recursive rendering
  ],
})
export class NodeFormComponent extends FormDirective implements OnInit {
  @Input() agentType!: keyof ARAGSchemas['agents'];
  @Input() agentName!: string;
  @Input() formGroupName!: string;

  // Optional inputs for recursive/nested usage
  @Input() parentForm?: FormGroup; // When used as a nested component
  @Input() nestedSchema?: JSONSchema4; // When rendering a specific sub-schema
  @Input() isNested?: boolean = false; // Flag to indicate nested usage

  @Output() formReady = new EventEmitter<FormGroup>();

  private workflowService = inject(WorkflowService);
  private fieldConfigService = inject(FieldConfigService);

  override form: FormGroup<any> = new FormGroup({
    [this.formGroupName as unknown as string]: new FormGroup({}),
  });

  isFormReady = false;
  schema: JSONSchema4 = {};
  renderableFields: RenderableField[] = [];

  ngOnInit() {
    if (this.isNested && this.nestedSchema && this.parentForm) {
      // When used as nested component, use provided schema and parent form
      this.schema = this.nestedSchema;
      this.form = this.parentForm;
      this.setupRenderableFields();
      this.isFormReady = true;
      this.formReady.emit(this.configForm);
    } else {
      // Normal usage - fetch schema from WorkflowService
      this.workflowService.schemas$.subscribe((schemas) => {
        const config = this.buildFormFromSchema(schemas, this.agentType, this.agentName);
        this.schema = config.schema || {};
        this.form = new FormGroup({
          [this.formGroupName as unknown as string]: config.formGroup,
        });
        this.setupRenderableFields();
        this.formReady.emit(this.configForm);
        this.isFormReady = true;
      });
    }
  }

  // Getter for the config form
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
      .map(([key, property]) => ({
        key,
        label: property.title || key,
        property: this.getPropertySchema(property),
        config: this.fieldConfigService.getFieldConfig(key, property),
        required: requiredFields.has(key),
      }));
  }

  // Get the actual schema for a property (resolving anyOf and $refs)
  private getPropertySchema(property: any): any {
    if (property.$ref) {
      return this.resolveRef(property.$ref);
    }
    if (property.anyOf) {
      // Find the first non-null object reference
      const objRef = property.anyOf.find((t: any) => t.$ref);
      if (objRef) {
        return this.resolveRef(objRef.$ref);
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
      return this.schema['$defs']?.[defName] || {};
    }
    return {};
  }
}
