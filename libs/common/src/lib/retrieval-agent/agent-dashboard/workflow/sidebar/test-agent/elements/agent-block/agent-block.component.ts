import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { AragAnswer, AragModule } from '@nuclia/core';
import { LineBreakFormatterPipe } from 'libs/common/src/lib/pipes';
import { AragAnswerUi } from '../../../../workflow.models';
import { AgentStepComponent } from '../agent-step';
import { ChipComponent } from '../chip';

@Component({
  selector: 'app-agent-block',
  imports: [CommonModule, ChipComponent, TranslateModule, AgentStepComponent, LineBreakFormatterPipe],
  templateUrl: './agent-block.component.html',
  styleUrl: './agent-block.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentBlockComponent {
  answer = input<AragAnswerUi>();
  result = input<AragAnswer>();

  title = computed(() => {
    const answer = this.answer();
    if (answer) {
      return `retrieval-agents.workflow.node-types.${this.getNodeKey(answer.module)}.title`;
    } else {
      return '';
    }
  });
  description = computed(() => {
    const answer = this.answer();
    if (this.result()) {
      return 'retrieval-agents.workflow.sidebar.test.interactions.results.description';
    } else if (answer) {
      return `retrieval-agents.workflow.sidebar.test.description.${this.getNodeKey(answer.module)}`;
    } else {
      return '';
    }
  });

  private getNodeKey(module: AragModule) {
    let nodeKey;
    switch (module) {
      case 'pre_conditional':
      case 'context_conditional':
      case 'post_conditional':
        nodeKey = 'conditional';
        break;
      default:
        nodeKey = module;
        break;
    }
    return nodeKey;
  }
}
