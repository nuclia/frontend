import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ServiceAccessComponent } from './service-access/service-access.component';

@Component({
  selector: 'app-knowledge-box-keys',
  templateUrl: './knowledge-box-keys.component.html',
  styleUrls: ['./knowledge-box-keys.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [TranslateModule, ServiceAccessComponent],
})
export class KnowledgeBoxKeysComponent {
  constructor() {}
}
