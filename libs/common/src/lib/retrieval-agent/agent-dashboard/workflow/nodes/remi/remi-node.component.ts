
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  ConfigBlockComponent,
  ConfigBlockItem,
  ConnectableEntryComponent,
  NodeBoxComponent,
  NodeDirective,
} from '../../basic-elements';
import { CommonAgentConfig } from '../../workflow.models';

@Component({
  selector: 'app-remi-node',
  imports: [ConnectableEntryComponent, NodeBoxComponent, TranslateModule, ConfigBlockComponent],
  templateUrl: './remi-node.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RemiNodeComponent extends NodeDirective {
  private translate = inject(TranslateService);

  remiConfig = computed<ConfigBlockItem[]>(() => {
    if (this.config()) {
      const config = this.config() as CommonAgentConfig;
      return [
        {
          title: this.translate.instant('retrieval-agents.workflow.common-forms.rules.label'),
          content:
            config.rules?.join('<br>') ||
            this.translate.instant('retrieval-agents.workflow.common-forms.rules.no-rules'),
        },
      ];
    }
    return [];
  });
}
