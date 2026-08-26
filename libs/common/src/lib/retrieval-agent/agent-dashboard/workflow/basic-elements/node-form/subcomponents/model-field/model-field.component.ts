import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, Input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ModelSelectorComponent } from '../../../../../../../ai-models';
import { WorkflowService } from '../../../../workflow.service';

let nextId = 0;

@Component({
  selector: 'app-model-field',
  templateUrl: './model-field.component.html',
  styleUrl: './model-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, ModelSelectorComponent, PaTogglesModule, ReactiveFormsModule, TranslateModule],
})
export class ModelFieldComponent {
  @Input() label: string = '';
  @Input() form!: FormGroup;
  @Input() required: boolean = false;

  private workflowService = inject(WorkflowService);

  id = signal<number>(0);

  constructor() {
    this.id.set(++nextId);
  }

  modelSchemas = this.workflowService.modelSchemas$;
  generativeProviders = this.workflowService.generativeProviders$;

  get reasoningControl() {
    return this.form.controls['reasoning'] as FormControl<'enabled' | 'disabled' | null>;
  }
}
