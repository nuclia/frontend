import { Component, effect, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  AccordionBodyDirective,
  AccordionItemComponent,
  OptionModel,
  PaTextFieldModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { registeredAgentParams, rootSchema } from '../../workflow.state';
import { WorkflowService } from '../../workflow.service';
import { convertNodeTypeToConfigTitle } from '../../workflow.utils';
import { distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-registered-agent-subform',
  templateUrl: 'registered-agent-subform.component.html',
  styleUrls: ['./registered-agent-subform.component.scss'],
  imports: [PaTextFieldModule, ReactiveFormsModule, TranslateModule, AccordionBodyDirective, AccordionItemComponent],
})
export class RegisteredAgentSubformComponent implements OnInit {
  expanded = true;
  form = new FormGroup({
    description: new FormControl<string>('', { nonNullable: true }),
    functions: new FormControl<string>('', { nonNullable: true }),
  });
  private nodeType = '';
  publishedFunctions: string[] = [];
  functionOptions: OptionModel[] = [];

  constructor() {
    effect(() => {
      const params = registeredAgentParams();
      const description = params.description || '';
      const functions = params.functions?.join(',') || '';
      if (description !== this.form.value.description || functions !== this.form.value.functions) {
        this.form.patchValue(
          { description: params.description, functions: params.functions.join(',') },
          { emitEvent: false },
        );
        this.nodeType = params.nodeType;
        const schemas = rootSchema();
        if (schemas) {
          const schemaName = convertNodeTypeToConfigTitle(params.nodeType, schemas);
          const matchingSchema = schemas['$defs'][schemaName];
          this.functionOptions = (matchingSchema?.properties['published_functions'].default || []).map(
            (func: string) => new OptionModel({ id: func, value: func, label: func }),
          );
        }
      }
    });
  }

  ngOnInit(): void {
    this.form.valueChanges.pipe(distinctUntilChanged()).subscribe((values) => {
      registeredAgentParams.set({
        description: values.description || '',
        functions: values.functions ? values.functions.split(',') : [],
        modified: true,
        nodeType: this.nodeType,
      });
    });
  }
}
