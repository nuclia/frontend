import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import {
  ModalRef,
  PaButtonModule,
  PaDateTimeModule,
  PaIconModule,
  PaModalModule,
  PaTableModule,
} from '@guillotinaweb/pastanaga-angular';
import { LogEntity } from '../../../logic';
import { SDKService } from '@flaps/core';
import { switchMap, take } from 'rxjs';
import { JobLog, JobLogsPage } from '@nuclia/core';
import { TranslateModule } from '@ngx-translate/core';
import { InfoCardComponent } from '@nuclia/sistema';

@Component({
  imports: [
    CommonModule,
    InfoCardComponent,
    PaDateTimeModule,
    PaIconModule,
    PaModalModule,
    PaTableModule,
    PaButtonModule,
    TranslateModule,
  ],
  templateUrl: './logs-modal.component.html',
  styleUrl: './logs-modal.component.scss',
})
export class LogsModalComponent {
  sdkService = inject(SDKService);

  job = this.modal.config.data;
  logPages = signal<JobLogsPage[]>([]);
  loading = signal<boolean>(false);

  logs = computed<(JobLog & { error: boolean })[]>(() =>
    this.logPages()
      .reduce((acc, curr) => acc.concat(curr.items), [] as JobLog[])
      .map((item) => ({ ...item, error: ['WARNING', 'ERROR', 'EXCEPTION', 'CRITICAL'].includes(item.level) })),
  );
  nextCursor = computed(() => this.logPages()[this.logPages().length - 1]?.next_cursor);

  constructor(public modal: ModalRef<LogEntity>) {
    this.loadPage();
  }

  loadPage(cursor?: string) {
    this.loading.set(true);
    return this.sdkService.currentKb
      .pipe(
        take(1),
        switchMap((kb) => kb.syncManager.getJobLogs(this.job?.payload['id'] || '', { cursor })),
      )
      .subscribe((res) => {
        this.logPages.set(this.logPages().concat([res]));
        this.loading.set(false);
      });
  }
}
