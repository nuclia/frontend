import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ConfigBlockComponent, NodeBoxComponent, NodeDirective } from '../../basic-elements';

@Component({
  selector: 'app-restart-node',
  imports: [CommonModule, ConfigBlockComponent, NodeBoxComponent, TranslateModule],
  templateUrl: './restart-node.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestartNodeComponent extends NodeDirective {}
