import { AfterViewInit, ChangeDetectionStrategy, Component, output, ViewChild } from '@angular/core';
import { PaTranslateModule } from '@guillotinaweb/pastanaga-angular';
import { ArrowDownComponent, ConnectableEntryComponent, NodeBoxComponent, NodeDirective } from '../../basic-elements';
import { WorkflowRoot } from '../../workflow.models';
import { WorkflowService } from '../../workflow.service';

@Component({
  selector: 'app-workflow-root',
  imports: [NodeBoxComponent, ConnectableEntryComponent, PaTranslateModule, ArrowDownComponent],
  templateUrl: './workflow-root.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowRootComponent extends NodeDirective implements AfterViewInit {
  rootInitialized = output<WorkflowRoot>();

  constructor(private workflowService: WorkflowService) {
    super();
  }

  @ViewChild('preprocess', { read: ConnectableEntryComponent }) preprocess!: ConnectableEntryComponent;
  @ViewChild('context', { read: ConnectableEntryComponent }) context!: ConnectableEntryComponent;
  @ViewChild('generation', { read: ConnectableEntryComponent }) generation!: ConnectableEntryComponent;
  @ViewChild('postprocess', { read: ConnectableEntryComponent }) postprocess!: ConnectableEntryComponent;

  ngAfterViewInit(): void {
    this.workflowService.fetchDrivers();
    this.workflowService.fetchModels();
    this.workflowService.fetchSchemas();
    this.rootInitialized.emit({
      preprocess: this.preprocess,
      context: this.context,
      generation: this.generation,
      postprocess: this.postprocess,
    });
  }
}
