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
import { filter, map, switchMap, take } from 'rxjs';
import { WorkflowModalComponent } from './workflow-modal';
import { ActivatedRoute, Router } from '@angular/router';
import { WorkflowsService } from './workflows.service';
import { ToolParametersModalComponent } from './tool-parameters-modal';
import { McpEndpointModalComponent } from './mcp-endpoint-modal';

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

  workflows = this.workflowsService.workflows.pipe(
    map((workflows) => [...workflows].sort((a, b) => a.name.localeCompare(b.name))),
  );

  goToWorkflow(workflow: Workflow) {
    this.router.navigate([workflow.id], { relativeTo: this.route });
  }

  openMcpEndpoint() {
    this.modalService.openModal(McpEndpointModalComponent);
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
        switchMap((workflow) => this.workflowsService.createWorkflow(workflow).pipe(map(() => workflow))),
      )
      .subscribe({
        next: (workflow) => this.goToWorkflow(workflow),
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
        switchMap(() => this.workflowsService.deleteWorkflow(workflow.id)),
      )
      .subscribe({
        error: () => {
          this.toaster.error('retrieval-agents.workflows-list.errors.deletion');
        },
      });
  }
}
