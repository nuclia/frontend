import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ConfigBlockItem } from '../../../basic-elements';
import { NodeType } from '../../../workflow.models';
import { ChipComponent } from './chip.component';

@Component({
  selector: 'app-agent-block',
  imports: [CommonModule, ChipComponent, TranslateModule],
  templateUrl: './agent-block.component.html',
  styleUrl: './agent-block.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentBlockComponent {
  nodeType = input.required<NodeType>();
  config = input.required<ConfigBlockItem[]>();
  cost = input<{ timing: number; tokens: number }>();

  formattedCost = computed(() => {
    const cost = this.cost();
    return cost ? `${cost.timing / 1000}s | ${cost.tokens} tokens` : '';
  });

  title = computed(() => `retrieval-agents.workflow.node-types.${this.getNodeKey(this.nodeType())}.title`);
  description = computed(
    () => `retrieval-agents.workflow.sidebar.test.description.${this.getNodeKey(this.nodeType())}`,
  );

  private getNodeKey(nodeType: NodeType) {
    let nodeKey;
    switch (nodeType) {
      case 'pre_conditional':
      case 'context_conditional':
      case 'post_conditional':
        nodeKey = 'conditional';
        break;
      default:
        nodeKey = nodeType;
        break;
    }
    return nodeKey;
  }
}
