import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PaTranslateModule } from '@guillotinaweb/pastanaga-angular';
import { ArrowDownComponent, ConnectableEntryComponent, NodeBoxComponent, NodeDirective } from '../../basic-elements';

@Component({
  selector: 'app-workflow-root',
  imports: [CommonModule, NodeBoxComponent, ConnectableEntryComponent, PaTranslateModule, ArrowDownComponent],
  templateUrl: './workflow-root.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowRootComponent extends NodeDirective {}
