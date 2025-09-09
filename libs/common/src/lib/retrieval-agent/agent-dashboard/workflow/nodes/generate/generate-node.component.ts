
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ConfigBlockComponent, ConfigBlockItem, NodeBoxComponent, NodeDirective } from '../../basic-elements';
import { GenerateAgentUI } from '../../workflow.models';

@Component({
  selector: 'app-generate-node',
  imports: [ConfigBlockComponent, NodeBoxComponent, TranslateModule],
  templateUrl: './generate-node.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenerateNodeComponent extends NodeDirective {
  private translate = inject(TranslateService);
  generateConfig = computed<ConfigBlockItem[]>(() => {
    if (this.config()) {
      const config = this.config() as GenerateAgentUI;
      const promptConfig = config.prompt
        ? {
            title: 'Prompt',
            content: config.prompt,
          }
        : { content: this.translate.instant('retrieval-agents.workflow.node-types.generate.config.default-prompt') };
      return [promptConfig];
    }
    return [];
  });
}
