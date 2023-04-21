import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  templateUrl: './knowledge-boxes.component.html',
  styleUrls: ['./knowledge-boxes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KnowledgeBoxesComponent {}
