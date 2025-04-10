import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ConfigBlockComponent, NodeBoxComponent, NodeDirective } from '../../basic-elements';

@Component({
  selector: 'app-sql-node',
  imports: [CommonModule, ConfigBlockComponent, NodeBoxComponent, TranslateModule],
  templateUrl: './sql-node.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SqlNodeComponent extends NodeDirective {}
