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
  selector: 'app-validation-node',
  imports: [CommonModule, ConfigBlockComponent, NodeBoxComponent, TranslateModule, ConnectableEntryComponent],
  templateUrl: './validation-node.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ValidationNodeComponent extends NodeDirective {
  validationConfig = computed<ConfigBlockItem[]>(() => {
    if (this.config()) {
      // const config = this.config() as ValidationAgent;
      // return [{ content: config.prompt }];
    }
    return [];
  });
}
