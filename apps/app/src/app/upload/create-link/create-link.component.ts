import { Component, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { STFTrackingService } from '@flaps/core';
import { SDKService } from '@flaps/core';
import { LabelValue } from '@nuclia/core';
import { switchMap } from 'rxjs';
import { SisToastService } from '@nuclia/sistema';

@Component({
  selector: 'app-create-link',
  templateUrl: './create-link.component.html',
  styleUrls: ['./create-link.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateLinkComponent {
  linkForm = this.formBuilder.group({
    link: ['', [Validators.pattern(/^http(s?):\/\//)]],
  });

  validationMessages = {
    link: {
      pattern: 'validation.url_required',
    },
  };

  selectedLabels: LabelValue[] = [];
  message: string | undefined;

  constructor(
    public dialogRef: MatDialogRef<CreateLinkComponent>,
    private formBuilder: UntypedFormBuilder,
    private sdk: SDKService,
    private tracking: STFTrackingService,
    private toaster: SisToastService,
  ) {}

  add() {
    if (this.linkForm.valid) {
      this.tracking.logEvent('link_upload');
      this.sdk.currentKb
        .pipe(
          switchMap((kb) =>
            kb.createLinkResource({ uri: this.linkForm.value.link }, { classifications: this.selectedLabels }),
          ),
        )
        .subscribe({
          next: () => {
            this.dialogRef.close();
            this.sdk.refreshCounter();
          },
          error: () => this.toaster.error('link.create.error'),
        });
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}
