import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PaButtonModule, PaDropdownModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { InfoCardComponent } from '@nuclia/sistema';
import { SubscriptionsService } from './subscriptions.service';

@Component({
  selector: 'nma-subscriptions',
  templateUrl: './subscriptions.component.html',
  styleUrl: './subscriptions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SubscriptionsService],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    PaTextFieldModule,
    PaDropdownModule,
    InfoCardComponent,
    NgTemplateOutlet,
    PaButtonModule,
    AsyncPipe,
  ],
})
export class SubscriptionsComponent {
  protected service = inject(SubscriptionsService);

  showCloudZeroDeleteConfirm = signal(false);
  showManualDeleteConfirm = signal(false);
}
