import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, output, ViewChild } from '@angular/core';
import { PaTranslateModule } from '@guillotinaweb/pastanaga-angular';
import { ArrowDownComponent, ConnectableEntryComponent, NodeBoxComponent, NodeDirective } from '../../basic-elements';
import { WorkflowRoot } from '../../workflow.models';

@Component({
  selector: 'app-workflow-root',
  imports: [CommonModule, NodeBoxComponent, ConnectableEntryComponent, PaTranslateModule, ArrowDownComponent],
  templateUrl: './workflow-root.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowRootComponent extends NodeDirective implements AfterViewInit {
  rootInitialized = output<WorkflowRoot>();

  @ViewChild('preprocess', { read: ConnectableEntryComponent }) preprocess!: ConnectableEntryComponent;
  @ViewChild('context', { read: ConnectableEntryComponent }) context!: ConnectableEntryComponent;
  @ViewChild('postprocess', { read: ConnectableEntryComponent }) postprocess!: ConnectableEntryComponent;

  ngAfterViewInit(): void {
    this.rootInitialized.emit({
      preprocess: this.preprocess,
      context: this.context,
      postprocess: this.postprocess,
    });
  }
}
