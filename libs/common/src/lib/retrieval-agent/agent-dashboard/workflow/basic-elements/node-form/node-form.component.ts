import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, inject, input, Input, OnChanges, OnInit, Output, signal, SimpleChanges } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { JSONSchema4 } from 'json-schema';
import { ConfigurationFormComponent } from '../configuration-form/configuration-form.component';
import { PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { RulesFieldComponent } from '../rules-field/rules-field.component';
import { CommonModule } from '@angular/common';
import { FormDirective } from '../form.directive';
import { WorkflowService } from '../../workflow.service';
import { ARAGSchemas } from '@nuclia/core';
import { ModelSelectComponent, ArrayStringFieldComponent, DriverSelectComponent } from './subcomponents';

@Component({
  selector: 'app-node-form',
  templateUrl: './node-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    ConfigurationFormComponent,
    PaButtonModule,
    PaTogglesModule,
    PaTextFieldModule, 
    RulesFieldComponent, 
    CommonModule,
    ModelSelectComponent, 
    DriverSelectComponent,
    ArrayStringFieldComponent
  ]
})
export class NodeFormComponent extends FormDirective implements OnInit {
    @Input() agentType!: keyof ARAGSchemas['agents'];
    @Input() agentName!: string;
    @Input() formGroupName!: string;

    @Output() formReady = new EventEmitter<FormGroup>();

  private workflowService = inject(WorkflowService);

  override form: FormGroup<any> = new FormGroup({
      [this.formGroupName as unknown as string]: new FormGroup({})
  });

  isFormReady = false;
  schema: JSONSchema4 = {};

  ngOnInit() {
    this.workflowService.schemas$.subscribe((schemas) => {
      const config = this.buildFormFromSchema(schemas, this.agentType, this.agentName);
      this.schema = config.schema || {};
      this.form = new FormGroup({
        [this.formGroupName as unknown as string]: config.formGroup
      });
      this.formReady.emit(this.configForm);
      this.isFormReady = true;
    });
  }

  // Getter for the config form
  override get configForm(): FormGroup {
    return this.form.controls[this.formGroupName] as FormGroup;
  }

  // Don't render these fields
  isFieldIgnored(key: string): boolean {
    const ignoredFields = new Set(['type', 'id', 'module', 'title']);
    return ignoredFields.has(key)
      || !!this.schema.properties?.[key]?.title?.includes?.('agent');
  }

  // Required fields from schema
  get requiredFields(): Set<string> {
    const required = this.schema?.required && Array.isArray(this.schema?.required) ? this.schema.required : [];
    return new Set(required);
  }

  // All schema keys
  get schemaKeys(): string[] {
    const keys = Object.keys(this.schema.properties || {});;
    return keys;
  }

  // Determine the type of a property, considering anyOf and const
  getType(property: any): string {
    if (property.const) return 'const';
    if (property.type) return property.type;
    if (property.anyOf) {
      // Prefer first non-null type
      const typeObj = property.anyOf.find((t: any) => t.type && t.type !== 'null');
      if (typeObj) {
        if (typeObj.type === 'array' && typeObj.items) {
          return 'array';
        }
        return typeObj.type;
      }
    }
    return 'string';
  }
}