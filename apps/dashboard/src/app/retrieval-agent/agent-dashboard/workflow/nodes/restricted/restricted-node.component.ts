import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ConfigBlockComponent, ConfigBlockItem, NodeBoxComponent, NodeDirective } from '../../basic-elements';
import { RestrictedAgentUI } from '../../workflow.models';

@Component({
  selector: 'app-restricted-node',
  imports: [CommonModule, ConfigBlockComponent, NodeBoxComponent, TranslateModule],
  templateUrl: './restricted-node.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestrictedNodeComponent extends NodeDirective {
  private translate = inject(TranslateService);

  restrictedConfig = computed<ConfigBlockItem[]>(() => {
    if (this.config()) {
      const config = this.config() as RestrictedAgentUI;
      return [
        {
          title: this.translate.instant('retrieval-agents.workflow.node-types.restricted.form.code'),
          content: config.code.replaceAll('\n', '<br>'),
        },
      ];
    }
    return [];
  });
}
