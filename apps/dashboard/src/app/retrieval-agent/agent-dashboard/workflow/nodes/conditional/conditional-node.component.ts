import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ConfigBlockComponent, ConnectableEntryComponent, NodeBoxComponent, NodeDirective } from '../../basic-elements';

@Component({
  selector: 'app-conditional-node',
  imports: [CommonModule, TranslateModule, NodeBoxComponent, ConnectableEntryComponent, ConfigBlockComponent],
  templateUrl: './conditional-node.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConditionalNodeComponent extends NodeDirective {}
