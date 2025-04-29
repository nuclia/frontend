import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import {
  ConfigBlockComponent,
  ConfigBlockItem,
  ConnectableEntryComponent,
  NodeBoxComponent,
  NodeDirective,
} from '../../basic-elements';
import { ConditionalAgentUI } from '../../workflow.models';

@Component({
  selector: 'app-conditional-node',
  imports: [CommonModule, TranslateModule, NodeBoxComponent, ConnectableEntryComponent, ConfigBlockComponent],
  templateUrl: './conditional-node.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConditionalNodeComponent extends NodeDirective {
  conditionalConfig = computed<ConfigBlockItem[]>(() => {
    if (this.config()) {
      const config = this.config() as ConditionalAgentUI;
      return [{ content: config.prompt }];
    }
    return [];
  });
}
