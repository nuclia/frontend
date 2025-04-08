import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { AgentBoxComponent, NodeDirective } from '../../basic-elements';

@Component({
  selector: 'app-nucliadb-node',
  imports: [CommonModule, AgentBoxComponent, TranslateModule],
  templateUrl: './nucliadb-node.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NucliaDBNodeComponent extends NodeDirective {}
