import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { OptionModel, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { WorkflowService } from '../../../../workflow.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-model-select',
  templateUrl: './model-select.component.html',
  styleUrls: ['./model-select.component.scss'],
  standalone: true,
  imports: [CommonModule, PaTextFieldModule, ReactiveFormsModule, TranslateModule],
})
export class ModelSelectComponent implements OnInit {
  @Input() label: string = '';
  @Input() required: boolean = false;
  @Input() form?: FormGroup;
  @Input() controlName?: string;

  private workflowService = inject(WorkflowService);

  options = signal<OptionModel[] | null>(null);

  ngOnInit(): void {
    this.workflowService.models$.subscribe((models) => {
      if (models?.length) {
        this.options.set(
          models.map((option) => new OptionModel({ id: option.value, value: option.value, label: option.name })),
        );
      }
    });
  }
}
