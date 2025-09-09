import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationUI } from '../notification.model';
import { PaDateTimeModule, PaIconModule } from '@guillotinaweb/pastanaga-angular';
import { NotificationTypePipe } from '../notification-type.pipe';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { NavigationService } from '../../services';

@Component({
  selector: 'stf-notification',
  imports: [CommonModule, PaIconModule, PaDateTimeModule, NotificationTypePipe, TranslateModule, RouterModule],
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
