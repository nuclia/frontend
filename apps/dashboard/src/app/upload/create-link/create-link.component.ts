import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { SDKService, STFTrackingService } from '@flaps/core';
import { Classification } from '@nuclia/core';
import { Observable, of, switchMap, take } from 'rxjs';
import { SisToastService } from '@nuclia/sistema';
import { IErrorMessages } from '@guillotinaweb/pastanaga-angular';

@Component({
  selector: 'app-create-link',
  templateUrl: './create-link.component.html',
  styleUrls: ['./create-link.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateLinkComponent {
  linkForm = this.formBuilder.group({
    link: ['', [Validators.pattern(/^http(s?):\/\//)]],
    links: ['', [Validators.pattern(/^([\r\n]*http(s?):\/\/.*?)+$/)]],
    multiple: [false],
  });

  validationMessages: { [key: string]: IErrorMessages } = {
    link: {
      pattern: 'validation.url_required',
    } as IErrorMessages,
  };
  pending = false;
  selectedLabels: Classification[] = [];

  constructor(
    public dialogRef: MatDialogRef<CreateLinkComponent>,
    private formBuilder: UntypedFormBuilder,
    private sdk: SDKService,
    private tracking: STFTrackingService,
    private toaster: SisToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  add() {
    if (this.linkForm.valid) {
      this.pending = true;
      this.cdr?.markForCheck();
      let obs: Observable<{ uuid: string }>;
      if (this.linkForm.value.multiple) {
        this.tracking.logEvent('multiple_links_upload');
        const links: string[] = this.linkForm.value.links
          .split('\n')
          .map((link: string) => link.trim())
          .filter((link: string) => !!link);
        obs = this.sdk.currentKb.pipe(
          take(1),
          switchMap((kb) =>
            links.reduce(
              (acc, curr) =>
                acc.pipe(
                  switchMap(() => kb.createLinkResource({ uri: curr }, { classifications: this.selectedLabels })),
                ),
              of({ uuid: '' }),
            ),
          ),
        );
      } else {
        this.tracking.logEvent('link_upload');
        obs = this.sdk.currentKb.pipe(
          take(1),
          switchMap((kb) =>
            kb.createLinkResource({ uri: this.linkForm.value.link }, { classifications: this.selectedLabels }),
          ),
        );
      }
      obs.subscribe({
        next: () => {
          this.dialogRef.close();
          this.sdk.refreshCounter();
        },
        error: () => {
          this.pending = false;
          this.cdr?.markForCheck();
          this.toaster.error('link.create.error');
        },
      });
    }
  }

  close(): void {
    this.dialogRef.close({ cancel: true });
  }
}
