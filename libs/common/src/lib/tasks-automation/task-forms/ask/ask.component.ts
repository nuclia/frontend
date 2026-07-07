import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ExpandableTextareaComponent,
  InfoCardComponent,
  TwoColumnsConfigurationItemComponent,
  BadgeComponent,
} from '@nuclia/sistema';
import { TranslateModule } from '@ngx-translate/core';
import { TaskFormCommonConfig, TaskFormComponent } from '../task-form.component';
import { OptionModel, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TaskRouteDirective } from '../task-route.directive';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { KVSchema, KVSchemaField, TaskApplyTo, TaskName } from '@nuclia/core';
import { filter, map, take } from 'rxjs';
import { KvSchemasService } from '../../../knowledge-box-settings/kv-schemas/kv-schemas.service';
import { JSONSchema4, JSONSchema4TypeName } from 'json-schema';
import { NavigationService } from '@flaps/core';
import { RouterModule } from '@angular/router';

@Component({
  imports: [
    CommonModule,
    ExpandableTextareaComponent,
    InfoCardComponent,
    PaTextFieldModule,
    ReactiveFormsModule,
    RouterModule,
    TaskFormComponent,
    TranslateModule,
    TwoColumnsConfigurationItemComponent,
    PaTogglesModule,
    BadgeComponent,
  ],
  templateUrl: './ask.component.html',
  styleUrls: ['../../_task.common.scss', './ask.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AskComponent extends TaskRouteDirective {
  askForm = new FormGroup({
    json: new FormControl<boolean>(false, { nonNullable: true }),
    question: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    destination: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern('[0-9a-zA-Z_]+')],
    }),
    customPrompt: new FormControl<boolean>(false, { nonNullable: true }),
    fieldType: new FormControl<'json' | 'keyValue'>('json', { nonNullable: true }),
    kv_schema_id: new FormControl<string>('', { nonNullable: true }),
  });
  errorMessages = {
    required: 'validation.required',
    pattern: 'tasks-automation.generator.field-name.invalid',
  };

  askOperation = this.task.pipe(map((task) => task?.parameters?.operations?.find((operation) => operation.ask)?.ask));
  type: TaskName = 'ask';

  kvSchemas = this.kvSchemasService.schemas$;
  noKvSchemas = this.kvSchemas.pipe(map((schemas) => schemas.length === 0));
  kvSchemasOptions = this.kvSchemas.pipe(
    map((schemas) => schemas.map((schema) => new OptionModel({ id: schema.id, label: schema.id, value: schema.id }))),
  );
  schemasUrl = this.navigationService.kbUrl.pipe(map((kbUrl) => `${kbUrl}/manage/kv-schemas`));
  reviewDescriptions = signal<boolean>(false);

  jsonExample = {
    name: 'book',
    description: 'Information about the book',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'The title of the book',
        },
        author: {
          type: 'string',
          description: 'The author of the book',
        },
        ref_num: {
          type: 'string',
          description: 'The ISBN of the book',
        },
      },
      required: ['title', 'author', 'ref_num'],
    },
  };

  get isJSON() {
    return this.askForm.controls.json.value;
  }
  get customPrompt() {
    return this.askForm.controls.customPrompt.value;
  }

  get storeAsKeyValue() {
    return this.askForm.controls.fieldType.value === 'keyValue';
  }

  get kvSchemaId() {
    return this.askForm.controls.kv_schema_id.value;
  }

  constructor(
    private kvSchemasService: KvSchemasService,
    private navigationService: NavigationService,
  ) {
    super();
    this.askForm.controls.fieldType.valueChanges.subscribe((fieldType) => {
      this.askForm.controls.kv_schema_id.setValidators(fieldType === 'keyValue' ? Validators.required : []);
      this.askForm.controls.kv_schema_id.updateValueAndValidity();
    });

    this.askOperation
      .pipe(
        filter((operation) => !!operation),
        take(1),
      )
      .subscribe((operation) => {
        const customPrompt = !!operation.user_prompt && !operation.json;
        this.askForm.patchValue({
          ...operation,
          question: customPrompt ? operation.user_prompt : operation.question,
          customPrompt,
          fieldType: operation.store_as_key_value ? 'keyValue' : 'json',
        });
      });
  }

  onSave(commonConfig: TaskFormCommonConfig) {
    if (this.askForm.get('json')?.value) {
      try {
        JSON.parse(this.askForm.get('question')?.value || '');
      } catch (e) {
        this.toaster.error('tasks-automation.generator.your-question.invalid-json');
        return;
      }
    }
    const parameters = {
      name: commonConfig.name,
      filter: commonConfig.filter,
      filter_expression_json: commonConfig.filter_expression_json,
      llm: commonConfig.llm,
      on: TaskApplyTo.FULL_FIELD,
      operations: [
        {
          ask: {
            json: this.isJSON,
            question: this.customPrompt && !this.isJSON ? '' : this.askForm.get('question')?.value,
            user_prompt: this.customPrompt && !this.isJSON ? this.askForm.get('question')?.value : undefined,
            destination: this.askForm.get('destination')?.value,
            store_as_key_value: this.isJSON ? this.storeAsKeyValue : undefined,
            kv_schema_id: this.isJSON && this.storeAsKeyValue ? this.kvSchemaId : undefined,
            triggers: commonConfig.webhook && [commonConfig.webhook],
          },
        },
      ],
    };
    this.saveTask(this.type, parameters);
  }

  selectSchema(schemaId: string) {
    this.kvSchemas.pipe(take(1)).subscribe((schemas) => {
      const schema = schemas.find((s) => s.id === schemaId);
      if (schema) {
        const jsonSchema = JSON.stringify(this.convertKvSchemaToJsonSchema(schema), null, 2);
        this.askForm.controls.question.setValue(jsonSchema);
        this.reviewDescriptions.set(true);
      }
    });
  }

  convertKvSchemaToJsonSchema(schema: KVSchema) {
    const properties = schema.fields.reduce(
      (acc, field) => {
        acc[field.key] = this.convertKvFieldToJsonSchema(field);
        return acc;
      },
      {} as { [key: string]: JSONSchema4 },
    );
    const required = schema.fields.filter((field) => field.required).map((field) => field.key);
    return {
      name: schema.id,
      description: schema.description || '',
      parameters: {
        type: 'object',
        properties,
        ...(required.length > 0 ? { required } : {}),
      },
    };
  }

  convertKvFieldToJsonSchema(field: KVSchemaField): JSONSchema4 {
    let type: JSONSchema4TypeName;
    switch (field.type) {
      case 'text':
      case 'date':
        type = 'string';
        break;
      case 'float':
        type = 'number';
        break;
      case 'boolean':
      case 'integer':
        type = field.type;
        break;
    }
    // For now, range fields are converted to string arrays because nested objects are not supported in the JSONSchema.
    if (field.range) {
      return { type: 'array', items: { type: 'string' }, description: field.description || '' };
    }
    // For now, repeated fields are converted to string arrays because number and boolean arrays are not supported.
    if (field.repeated) {
      return { type: 'array', items: { type: 'string' }, description: field.description || '' };
    }
    return { type, description: field.description || '' };
  }

  onJSONChange() {
    this.askForm.controls.question.reset();
    this.askForm.controls.customPrompt.reset();
    this.askForm.controls.fieldType.reset();
    this.askForm.controls.kv_schema_id.reset();
  }
}
