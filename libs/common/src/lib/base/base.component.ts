import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationService, NotificationsPanelComponent } from '@flaps/core';
import { TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { TopbarComponent } from '../topbar/topbar.component';

@Component({
  selector: 'app-base',
  templateUrl: './base.component.html',
  styleUrls: ['./base.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [TopbarComponent, RouterOutlet, NotificationsPanelComponent, TranslatePipe, TranslateModule],
})
export class BaseComponent implements OnInit {
  private notificationService = inject(NotificationService);

  isNotificationPanelOpen = false;

  ngOnInit() {
    this.notificationService.startListening();
  }

  skipToMain(event: Event) {
    event.preventDefault();
    const main = document.getElementById('dashboard-main');
    main?.scrollIntoView({ behavior: 'smooth' });
    main?.focus();
  }
}
