import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { WorkflowService } from '../../../../workflow.service';
import { TranslateModule } from '@ngx-translate/core';
import { ModelSelectorComponent } from 'libs/common/src/lib/ai-models';

@Component({
  selector: 'app-model-select',
  templateUrl: './model-select.component.html',
  styleUrls: ['./model-select.component.scss'],
  standalone: true,
  imports: [CommonModule, ModelSelectorComponent, ReactiveFormsModule, TranslateModule],
})
export class ModelSelectComponent {
  @Input() label: string = '';
  @Input() required: boolean = false;
  @Input() form?: FormGroup;
  @Input() controlName?: string;

  private workflowService = inject(WorkflowService);

  modelSchemas = this.workflowService.modelSchemas$;
  generativeProviders = this.workflowService.generativeProviders$;
}
