import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, input, viewChildren } from '@angular/core';
import { AccordionBodyDirective, AccordionComponent, AccordionItemComponent } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { AragAnswer, AragModule } from '@nuclia/core';
import { LineBreakFormatterPipe } from '../../../../../../../pipes';
import { getFormattedCost } from '../../../../../../arag.utils';
import { AragAnswerUi } from '../../../../workflow.models';
import { AgentContextComponent } from '../agent-context';
import { AgentStepComponent } from '../agent-step';
import { BlockquoteComponent } from '../blockquote';
import { ChipComponent } from '../chip';

@Component({
  selector: 'app-agent-block',
  imports: [
    CommonModule,
    ChipComponent,
    BlockquoteComponent,
    AgentStepComponent,
    AgentContextComponent,
    LineBreakFormatterPipe,
    AccordionComponent,
    AccordionBodyDirective,
    AccordionItemComponent,
    TranslateModule,
  ],
  templateUrl: './agent-block.component.html',
  styleUrl: './agent-block.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentBlockComponent {
  answer = input<AragAnswerUi>();
  result = input<AragAnswer>();

  accordionItems = viewChildren(AccordionItemComponent);

  contextCost = computed(() => {
    const cost = (this.answer()?.steps || []).reduce(
      (cost, step) => {
        return {
          timing: cost.timing + step.timeit,
          input: cost.input + step.input_nuclia_tokens,
          output: cost.output + step.output_nuclia_tokens,
        };
      },
      { timing: 0, input: 0, output: 0 },
    );
    return getFormattedCost(cost.timing, cost.input, cost.output);
  });

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
    if (answer) {
      return `retrieval-agents.workflow.sidebar.test.description.${this.getNodeKey(answer.module)}`;
    } else {
      return '';
    }
  });

  constructor() {
    effect(() => {
      const accordions = this.accordionItems();
      if (this.answer()) {
        accordions.forEach((item) => item.updateContentHeight());
      }
    });
  }

  updateAccordionHeight(item: AccordionItemComponent) {
    // update accordion height once expander transition is done
    setTimeout(() => item.updateContentHeight(), 200);
  }

  private getNodeKey(module: AragModule) {
    let nodeKey;
    switch (module) {
      case 'pre_conditional':
      case 'context_conditional':
      case 'post_conditional':
        nodeKey = 'conditional';
        break;
      case 'brave':
      case 'google':
      case 'perplexity':
      case 'tavily':
        nodeKey = 'internet';
        break;
      default:
        nodeKey = module;
        break;
    }
    return nodeKey;
  }
}
