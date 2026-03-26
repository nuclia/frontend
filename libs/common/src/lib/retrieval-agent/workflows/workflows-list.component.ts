import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
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
import { filter, map, of, switchMap, take } from 'rxjs';
import { WorkflowModalComponent } from './workflow-modal';
import { ActivatedRoute, Router } from '@angular/router';
import { WorkflowsService } from './workflows.service';
import { SDKService } from '@flaps/core';
import { ToolParametersModalComponent } from './tool-parameters-modal';

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
  private sdk = inject(SDKService);

  workflows = this.workflowsService.workflows.pipe(
    map((workflows) => [...workflows].sort((a, b) => a.name.localeCompare(b.name))),
  );
  endpoint = this.sdk.currentArag.pipe(map((arag) => arag.fullpath + '/session/default/mcp'));
  copied = signal(false);

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

  editToolParameters(workflow: Workflow, event: MouseEvent | KeyboardEvent) {
    event.stopPropagation();
    this.modalService
      .openModal(ToolParametersModalComponent, new ModalConfig({ data: { workflow } }))
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

  copyEndpoint() {
    this.endpoint.pipe(take(1)).subscribe((endpoint) => {
      navigator.clipboard.writeText(endpoint);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1000);
    });
  }
}
