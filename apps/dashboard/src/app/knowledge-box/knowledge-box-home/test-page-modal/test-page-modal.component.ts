import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ModalRef,
  PaModalModule,
  PaDatePickerModule,
  PaTextFieldModule,
  PaButtonModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { DateAfter, SearchWidgetService } from '@flaps/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FeatureFlagService, SDKService } from '@flaps/core';
import { forkJoin, map, of, switchMap, take } from 'rxjs';
import { InfoCardComponent, SisToastService } from '@nuclia/sistema';

@Component({
  imports: [
    CommonModule,
    InfoCardComponent,
    PaButtonModule,
    PaDatePickerModule,
    PaModalModule,
    PaTextFieldModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
  templateUrl: './test-page-modal.component.html',
  styleUrl: './test-page-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestPageModalComponent {
  sdk = inject(SDKService);
  modal = inject(ModalRef);
  featureFlagService = inject(FeatureFlagService);
  searchWidgetService = inject(SearchWidgetService);
  toaster = inject(SisToastService);

  isPublic = this.sdk.currentKb.pipe(map((kb) => kb.state === 'PUBLISHED'));
  widgets = this.searchWidgetService.widgetList.pipe(
    map((widgets) => widgets.filter((widget) => ['page', 'chat'].includes(widget.widgetConfig?.widgetMode || ''))),
  );

  url = signal('');
  copied = signal(false);
  serviceTitle = 'widget_testing';

  form = new FormGroup({
    widget: new FormControl<string>('', { nonNullable: true, validators: Validators.required }),
    expiration: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, DateAfter(new Date().toISOString())],
    }),
  });

  constructor() {
    this.isPublic.pipe(take(1)).subscribe((isPublic) => {
      if (isPublic) {
        this.form.controls.expiration.setValidators([]);
      }
    });
  }

  generateUrl() {
    const values = this.form.getRawValue();
    const expiration = Math.floor(new Date(values.expiration).getTime() / 1000).toString();
    forkJoin([
      this.sdk.currentAccount.pipe(take(1)),
      this.sdk.currentKb.pipe(take(1)),
      this.widgets.pipe(take(1)),
      this.generateKey(expiration),
    ]).subscribe(([account, kb, widgets, key]) => {
      const selectedWidget = widgets.find((widget) => widget.slug === values.widget);
      const params = new URLSearchParams();
      params.append('zone', this.sdk.nuclia.options.zone || '');
      params.append('knowledgebox', kb.id);
      params.append('account', account.id);
      params.append('widget_id', values.widget);
      params.append('mode', selectedWidget?.widgetConfig?.widgetMode || '');
      if (kb.state === 'PRIVATE') {
        params.append('apikey', key);
      }
      if (this.featureFlagService.isStageOrDev) {
        params.append('env', 'dev');
      }
      this.url.set(`${location.origin}/assets/test/index.html?${params.toString()}`);
      this.form.markAsPristine();
    });
  }

  generateKey(expiration: string) {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) =>
        kb.state === 'PUBLISHED'
          ? of('')
          : kb.getServiceAccounts().pipe(
              switchMap((services) => {
                const service = services.find(
                  (service) => service.title === this.serviceTitle && service.role === 'SMEMBER',
                );
                return service
                  ? of(service)
                  : kb.createServiceAccount({ title: this.serviceTitle, role: 'SMEMBER' }).pipe(
                      switchMap(() => kb.getServiceAccounts()),
                      map((services) => services.find((service) => service.title === this.serviceTitle)),
                    );
              }),
              switchMap((service) => kb.createKey(service?.id || '', expiration)),
              map((key) => key.token),
            ),
      ),
    );
  }

  copy() {
    navigator.clipboard.writeText(this.url());
    this.copied.set(true);
    setTimeout(() => {
      this.copied.set(false);
    }, 1000);
  }

  close() {
    this.modal.close();
  }
}
