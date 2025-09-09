
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ConfigBlockComponent, ConfigBlockItem, NodeBoxComponent, NodeDirective } from '../../basic-elements';
import { SummarizeAgentUI } from '../../workflow.models';

@Component({
  selector: 'app-summarize-node',
  imports: [ConfigBlockComponent, NodeBoxComponent, TranslateModule],
  templateUrl: './summarize-node.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummarizeNodeComponent extends NodeDirective {
  private translate = inject(TranslateService);
  summarizeConfig = computed<ConfigBlockItem[]>(() => {
    if (this.config()) {
      const config = this.config() as SummarizeAgentUI;
      const promptConfig = config.prompt
        ? {
            title: 'Prompt',
            content: config.prompt,
          }
        : { content: this.translate.instant('retrieval-agents.workflow.node-types.summarize.config.default-prompt') };
      return [promptConfig];
    }
    return [];
  });
}
