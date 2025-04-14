import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ConfigBlockComponent, ConfigBlockItem, NodeBoxComponent, NodeDirective } from '../../basic-elements';

@Component({
  selector: 'app-internet-node',
  imports: [CommonModule, ConfigBlockComponent, NodeBoxComponent, TranslateModule],
  templateUrl: './internet-node.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InternetNodeComponent extends NodeDirective {
  internetConfig = computed<ConfigBlockItem[]>(() => {
    if (this.config()) {
      // const config = this.config() as InternetAgent;
      // return [{ content: config.prompt }];
    }
    return [];
  });
}
