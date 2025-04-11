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

@Component({
  selector: 'app-ask-node',
  imports: [CommonModule, ConfigBlockComponent, NodeBoxComponent, TranslateModule, ConnectableEntryComponent],
  templateUrl: './ask-node.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AskNodeComponent extends NodeDirective {
  askConfig = computed<ConfigBlockItem[]>(() => {
    if (this.config()) {
      // const config = this.config() as AskAgent;
      // return [{ content: config.prompt }];
    }
    return [];
  });
}
