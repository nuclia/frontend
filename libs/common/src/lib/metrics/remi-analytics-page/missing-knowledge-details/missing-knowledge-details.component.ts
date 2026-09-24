import { booleanAttribute, ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { PaButtonModule, PaTableModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { RemiQueryResponseContextDetails, RemiQueryResponseItem } from '@nuclia/core';
import { InfoCardComponent, SpinnerComponent } from '@nuclia/sistema';

@Component({
  selector: 'app-missing-knowledge-details',
  imports: [PaTableModule, InfoCardComponent, SpinnerComponent, TranslateModule, PaButtonModule],
  templateUrl: './missing-knowledge-details.component.html',
  styleUrls: ['./missing-knowledge-details.component.scss'],
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
