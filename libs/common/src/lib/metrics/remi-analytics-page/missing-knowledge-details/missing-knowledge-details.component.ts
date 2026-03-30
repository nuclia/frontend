import { booleanAttribute, ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { PaButtonModule, PaTableModule } from '@guillotinaweb/pastanaga-angular';
import { InfoCardComponent, SisProgressModule } from '@nuclia/sistema';
import { RemiQueryResponseContextDetails, RemiQueryResponseItem } from '@nuclia/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-missing-knowledge-details',
  imports: [PaTableModule, InfoCardComponent, SisProgressModule, TranslateModule, PaButtonModule],
  templateUrl: './missing-knowledge-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MissingKnowledgeDetailsComponent {
  readonly item = input.required<RemiQueryResponseItem>();
  readonly missingKnowledgeDetails = input.required<{ [id: number]: RemiQueryResponseContextDetails }>();
  readonly missingKnowledgeError = input.required<{ [id: number]: boolean }>();
  readonly noScore = input(false, { transform: booleanAttribute });

  readonly openViewer = output<string>();
  readonly requestAdvice = output<RemiQueryResponseItem>();
}
