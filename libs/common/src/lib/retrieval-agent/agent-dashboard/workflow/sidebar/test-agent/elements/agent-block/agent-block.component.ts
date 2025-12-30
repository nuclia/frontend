import { ChangeDetectionStrategy, Component, computed, effect, inject, input, viewChildren } from '@angular/core';
import { AccordionBodyDirective, AccordionComponent, AccordionItemComponent } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { AragAnswer, AragModule, Driver, IKnowledgeBoxItem, NucliaDBDriver } from '@nuclia/core';
import { LineBreakFormatterPipe } from '../../../../../../../pipes';
import { getFormattedCost } from '../../../../../../arag.utils';
import { AragAnswerUi } from '../../../../workflow.models';
import { AgentContextComponent } from '../agent-context';
import { AgentStepComponent } from '../agent-step';
import { BlockquoteComponent } from '../blockquote';
import { ChipComponent } from '../chip';
import { getNodeByAgentId } from '../../../../workflow.state';
import { toSignal } from '@angular/core/rxjs-interop';
import { SDKService } from '@flaps/core';
import { WorkflowService } from '../../../../workflow.service';

@Component({
  selector: 'app-agent-block',
  imports: [
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
  sdk = inject(SDKService);
  workflow = inject(WorkflowService);

  answer = input<AragAnswerUi>();
  result = input<AragAnswer>();

  accordionItems = viewChildren(AccordionItemComponent);
  kbList = toSignal(this.sdk.kbList, { initialValue: [] });
  drivers = toSignal(this.workflow.driverModels$, { initialValue: [] });

  contextCost = computed(() => {
    const cost = (this.answer()?.steps || []).reduce(
      (cost, step) => {
        return {
          timing: cost.timing + step.timeit,
          input: cost.input + (step.input_nuclia_tokens ?? 0),
          output: cost.output + (step.output_nuclia_tokens ?? 0),
        };
      },
      { timing: 0, input: 0, output: 0 },
    );
    return getFormattedCost(cost.timing, cost.input, cost.output);
  });

  title = computed(() => {
    const answer = this.answer();
    if (answer) {
      let title = `retrieval-agents.workflow.node-types.${this.getNodeKey(answer.module)}.title`;
      if (answer.module === 'basic_ask' || answer.module === 'ask' || answer.module === 'advanced_ask') {
        const kbTitle = this.getKbTitle(answer.agentId, this.drivers() || [], this.kbList());
        if (kbTitle) {
          title = kbTitle;
        }
      }
      return title;
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

  private getKbTitle(agentId: string | null, drivers: Driver[], kbList: IKnowledgeBoxItem[]) {
    const node = getNodeByAgentId(agentId || '', 'context')?.nodeConfig as { sources: string | string[] } | undefined;
    const sources = typeof node?.sources === 'string' ? node?.sources?.split(',') : node?.sources;
    if (sources?.length === 1) {
      const driver = drivers.find((driver) => driver.identifier === sources[0]) as NucliaDBDriver | undefined;
      return kbList.find((kb) => kb.id === driver?.config.kbid)?.title;
    }
    return undefined;
  }
}
