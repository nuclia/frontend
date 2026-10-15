import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SDKService, UserService } from '@flaps/core';
import { PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { InfoCardComponent, SisPasswordInputModule, SisToastService } from '@nuclia/sistema';
import { map, switchMap, take } from 'rxjs';
import { ConfigurationFormComponent } from '../../basic-elements';

@Component({
  imports: [
    ConfigurationFormComponent,
    InfoCardComponent,
    PaButtonModule,
    PaTextFieldModule,
    ReactiveFormsModule,
    SisPasswordInputModule,
    TranslatePipe,
  ],
  templateUrl: './export-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportPanelComponent {
  private sdk = inject(SDKService);
  private toaster = inject(SisToastService);
  private userService = inject(UserService);
  private translate = inject(TranslateService);

  form = new FormGroup({
    passphrase: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(16)],
    }),
  });

  panelCancel = output();

  submit() {
    const options = this.form.getRawValue();
    this.sdk.currentArag
      .pipe(
        take(1),
        switchMap((arag) => arag.export(options)),
        switchMap(() =>
          this.userService.userPrefs.pipe(
            take(1),
            map((user) => user?.email || ''),
          ),
        ),
      )
      .subscribe({
        next: (email) => {
          const message = this.translate.instant('retrieval-agents.workflow.sidebar.export.email-sent', { email });
          this.toaster.success(message);
          this.panelCancel.emit();
        },
        error: () => {
          this.toaster.error('retrieval-agents.workflow.sidebar.export.export-error');
        },
      });
  }
}
