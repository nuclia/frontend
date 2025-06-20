
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ConfigBlockComponent, ConfigBlockItem, NodeBoxComponent, NodeDirective } from '../../basic-elements';
import { HistoricalAgentUI } from '../../workflow.models';

@Component({
  selector: 'app-historical-node',
  imports: [ConfigBlockComponent, NodeBoxComponent, TranslateModule],
  templateUrl: './historical-node.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoricalNodeComponent extends NodeDirective {
  private translate = inject(TranslateService);

  historicalConfig = computed<ConfigBlockItem[]>(() => {
    if (this.config()) {
      const config = this.config() as HistoricalAgentUI;
      const configDescription = this.translate.instant(
        config.all
          ? 'retrieval-agents.workflow.node-types.historical.config.on'
          : 'retrieval-agents.workflow.node-types.historical.config.off',
      );
      return [{ content: configDescription }];
    }
    return [];
  });
}
