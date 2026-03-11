import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  ModalConfig,
  PaButtonModule,
  PaDropdownModule,
  PaPopupModule,
  PaTableModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Workflow } from '@nuclia/core';
import { InfoCardComponent, SisModalService, SisToastService } from '@nuclia/sistema';
import { filter, of, switchMap, take } from 'rxjs';
import { WorkflowModalComponent } from './workflow-modal';
import { ActivatedRoute, Router } from '@angular/router';
import { WorkflowsService } from './workflows.service';

@Component({
  imports: [
    CommonModule,
    InfoCardComponent,
    PaButtonModule,
    PaDropdownModule,
    PaPopupModule,
    PaTableModule,
    TranslateModule,
  ],
  templateUrl: './workflows-list.component.html',
  styleUrl: './workflows-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowsListComponent {
  private workflowsService = inject(WorkflowsService);
  private modalService = inject(SisModalService);
  private toaster = inject(SisToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private translate = inject(TranslateService);

  workflows = this.workflowsService.workflows;

  goToWorkflow(workflow: Workflow) {
    this.router.navigate([workflow.id], { relativeTo: this.route });
  }

  add() {
    this.workflowsService.workflows
      .pipe(
        take(1),
        switchMap(
          (workflows) =>
            this.modalService.openModal(WorkflowModalComponent, new ModalConfig({ data: { workflows } })).onClose,
        ),
        filter((workflow) => !!workflow),
        switchMap((workflow) => this.workflowsService.createWorkflow(workflow)),
      )
      .subscribe({
        error: () => {
          this.toaster.error('retrieval-agents.workflows-list.errors.creation');
        },
      });
  }

  edit(workflow: Workflow, event: MouseEvent | KeyboardEvent) {
    event.stopPropagation();
    this.modalService
      .openModal(WorkflowModalComponent, new ModalConfig({ data: { workflow } }))
      .onClose.pipe(
        filter((workflow) => !!workflow),
        switchMap((workflow) => this.workflowsService.patchWorkflow(workflow)),
      )
      .subscribe({
        error: () => {
          this.toaster.error('retrieval-agents.workflows-list.errors.edition');
        },
      });
  }

  delete(workflow: Workflow, event: MouseEvent | KeyboardEvent) {
    event.stopPropagation();
    return this.modalService
      .openConfirm({
        title: this.translate.instant('retrieval-agents.workflows-list.confirm-deletion.title', {
          name: workflow.name,
        }),
        description: 'retrieval-agents.workflows-list.confirm-deletion.description',
        isDestructive: true,
      })
      .onClose.pipe(
        filter((confirm) => !!confirm),
        switchMap(() => {
          // TODO: delete endpoint is not available yet
          //return this.workflowsService.deleteWorkflow(workflow.id)
          return of(undefined);
        }),
      )
      .subscribe({
        error: () => {
          this.toaster.error('retrieval-agents.workflows-list.errors.deletion');
        },
      });
  }
}
