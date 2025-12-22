import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SDKService } from '@flaps/core';
import { PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { SisToastService, SisPasswordInputModule, SisProgressModule } from '@nuclia/sistema';
import { switchMap, take } from 'rxjs';
import { ConfigurationFormComponent } from '../../basic-elements';

@Component({
  imports: [
    ConfigurationFormComponent,
    PaButtonModule,
    PaTextFieldModule,
    PaTogglesModule,
    ReactiveFormsModule,
    SisPasswordInputModule,
    SisProgressModule,
    TranslateModule,
  ],
  templateUrl: './import-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportPanelComponent {
  private sdk = inject(SDKService);
  private toaster = inject(SisToastService);

  form = new FormGroup({
    passphrase: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    overwrite: new FormControl<boolean>(false, { nonNullable: true }),
  });

  selectedFile = signal<File | undefined>(undefined);
  loading = signal(false);
  cancel = output();

  handleFile(event: Event) {
    this.selectedFile.set((event.target as HTMLInputElement).files?.[0] || undefined);
  }

  submit() {
    if (!this.selectedFile() || this.form.invalid) {
      return;
    }
    this.loading.set(true);
    this.sdk.currentArag
      .pipe(
        take(1),
        switchMap((arag) => arag.import({ ...this.form.getRawValue(), file: this.selectedFile() as File })),
        switchMap(() => this.sdk.refreshCurrentArag()),
      )
      .subscribe({
        next: () => {
          this.toaster.success('retrieval-agents.workflow.sidebar.import.import-sucess');
          this.cancel.emit();
        },
        error: (error) => {
          const message = error?.body?.detail;
          this.toaster.error(message || 'retrieval-agents.workflow.sidebar.import.import-error');
          this.loading.set(false);
        },
      });
  }
}
