import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaTableModule } from '@guillotinaweb/pastanaga-angular';
import { InfoCardComponent, SisProgressModule } from '@nuclia/sistema';
import { RemiQueryResponseContextDetails, RemiQueryResponseItem } from '@nuclia/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'stf-missing-knowledge-details',
  standalone: true,
  imports: [CommonModule, PaTableModule, InfoCardComponent, SisProgressModule, TranslateModule],
  templateUrl: './missing-knowledge-details.component.html',
  styleUrl: './missing-knowledge-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MissingKnowledgeDetailsComponent {
  @Input({ required: true }) item!: RemiQueryResponseItem;
  @Input({ required: true }) missingKnowledgeDetails: { [id: number]: RemiQueryResponseContextDetails } = {};
  @Input({ required: true }) missingKnowledgeError: { [id: number]: boolean } = {};
}
