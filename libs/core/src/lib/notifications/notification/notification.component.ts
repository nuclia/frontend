import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PaDateTimeModule, PaIconModule } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { NavigationService } from '../../services';
import { NotificationTypePipe } from '../notification-type.pipe';
import { NotificationUI } from '../notification.model';

@Component({
  selector: 'stf-notification',
  imports: [CommonModule, PaIconModule, PaDateTimeModule, NotificationTypePipe, TranslatePipe, RouterModule],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationComponent {
  private navigationService = inject(NavigationService);

  @Input() message?: NotificationUI;

  @Output() followLink = new EventEmitter<void>();

  maxItemsPerNotification = 10;
  resourceListUrl = this.navigationService.getResourceListUrl();
}
