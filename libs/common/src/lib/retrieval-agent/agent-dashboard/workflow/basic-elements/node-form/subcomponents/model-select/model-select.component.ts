import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ModelSelectorComponent } from '../../../../../../../ai-models';
import { WorkflowService } from '../../../../workflow.service';

@Component({
  selector: 'app-model-select',
  templateUrl: './model-select.component.html',
  styleUrls: ['./model-select.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, ModelSelectorComponent, ReactiveFormsModule],
})
export class ModelSelectComponent {
  @Input() label = '';
  @Input() required = false;
  @Input() form?: FormGroup;
  @Input() controlName?: string;

  private workflowService = inject(WorkflowService);

  modelSchemas = this.workflowService.modelSchemas$;
  generativeProviders = this.workflowService.generativeProviders$;
}
