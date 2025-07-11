
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ConfigBlockComponent, ConfigBlockItem, NodeBoxComponent, NodeDirective } from '../../basic-elements';
import { InternetAgentUI } from '../../workflow.models';

@Component({
  selector: 'app-internet-node',
  imports: [ConfigBlockComponent, NodeBoxComponent, TranslateModule],
  templateUrl: './internet-node.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InternetNodeComponent extends NodeDirective {
  private translate = inject(TranslateService);

  internetConfig = computed<ConfigBlockItem[]>(() => {
    if (this.config()) {
      const config = this.config() as InternetAgentUI;
      return [
        {
          title: this.translate.instant('retrieval-agents.workflow.node-types.internet.form.provider.label'),
          content: config.provider.substring(0, 1).toUpperCase() + config.provider.substring(1),
        },
      ];
    }
    return [];
  });
}
