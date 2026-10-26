import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ServiceAccessComponent } from './service-access/service-access.component';

@Component({
  selector: 'app-knowledge-box-keys',
  templateUrl: './knowledge-box-keys.component.html',
  styleUrls: ['./knowledge-box-keys.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, ServiceAccessComponent],
})
export class KnowledgeBoxKeysComponent {
  embedded = !!inject(ActivatedRoute).snapshot.data['embedded'];
}
