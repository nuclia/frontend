import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { AgentBoxComponent, NodeDirective } from '../basic-elements';

@Component({
  selector: 'app-cypher-node',
  imports: [CommonModule, AgentBoxComponent, TranslateModule],
  templateUrl: './cypher-node.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CypherNodeComponent extends NodeDirective {}
