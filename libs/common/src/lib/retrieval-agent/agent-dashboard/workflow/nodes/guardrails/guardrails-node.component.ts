
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ConfigBlockComponent, ConfigBlockItem, NodeBoxComponent, NodeDirective } from '../../basic-elements';
import { GuardrailsAgentUI } from '../../workflow.models';

@Component({
  selector: 'app-guardrails-node',
  imports: [ConfigBlockComponent, NodeBoxComponent, TranslateModule],
  templateUrl: './guardrails-node.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuardrailsNodeComponent extends NodeDirective {
  private translate = inject(TranslateService);

  guardrailsConfig = computed<ConfigBlockItem[]>(() => {
    if (this.config()) {
      const config = this.config() as GuardrailsAgentUI;
      return [
        {
          title: this.translate.instant('retrieval-agents.workflow.node-types.guardrails.form.provider.label'),
          content: config.provider.substring(0, 1).toUpperCase() + config.provider.substring(1),
        },
        {
          title: this.translate.instant('retrieval-agents.workflow.node-types.guardrails.form.preconfig.label'),
          content: this.translate.instant(
            `retrieval-agents.workflow.node-types.guardrails.form.preconfig.${config.alinia.preconfig}`,
          ),
        },
      ];
    }
    return [];
  });

  nodeTitle = computed(() => {
    return `retrieval-agents.workflow.node-types.${
      this.category() === 'preprocess' ? 'preprocess_alinia' : 'postprocess_alinia'
    }.title`;
  });
}
