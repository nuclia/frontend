import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { SubscriptionsService } from './subscriptions.service';

@Component({
  selector: 'nma-subscriptions',
  templateUrl: './subscriptions.component.html',
  styleUrl: './subscriptions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
  providers: [SubscriptionsService],
})
export class SubscriptionsComponent {
  protected service = inject(SubscriptionsService);

  showCloudZeroDeleteConfirm = signal(false);
  showManualDeleteConfirm = signal(false);
}
