import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ConfigBlockComponent, NodeBoxComponent, NodeDirective } from '../../basic-elements';

@Component({
  selector: 'app-rephrase-node',
  imports: [CommonModule, NodeBoxComponent, TranslateModule, ConfigBlockComponent],
  templateUrl: './rephrase-node.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RephraseNodeComponent extends NodeDirective {}
