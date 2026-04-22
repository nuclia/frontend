import { ChangeDetectionStrategy, Component, EventEmitter, inject, Output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PaButtonModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { map } from 'rxjs';
import { CommonModule } from '@angular/common';
import { WorkflowType } from '@nuclia/core';
import { StickyFooterComponent } from '@nuclia/sistema';

@Component({
  selector: 'nus-account-workflow',
  imports: [CommonModule, PaButtonModule, PaTogglesModule, ReactiveFormsModule, StickyFooterComponent, TranslateModule],
  templateUrl: './account-workflow.component.html',
  styleUrls: ['../_common-step.scss', './account-workflow.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountWorkflowComponent {
  private translateService = inject(TranslateService);

  @Output() next = new EventEmitter<WorkflowType>();

  // Radio buttons must be rendered once translations are ready
  translationsReady = this.translateService.get('test').pipe(map(() => true));

  workflow = new FormControl<WorkflowType>('classic', { nonNullable: true });

  submit() {
    this.next.emit(this.workflow.value);
  }
}
