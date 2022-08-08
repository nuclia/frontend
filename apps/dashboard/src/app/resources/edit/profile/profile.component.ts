import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { SDKService } from '@flaps/core';
import { LabelValue, Resource } from '@nuclia/core';
import { forkJoin, map, Observable, switchMap } from 'rxjs';
import { BaseEditComponent } from '../base-edit.component';
import { SisToastService } from '@nuclia/sistema';

@Component({
  selector: 'app-resource-profile',
  templateUrl: 'profile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceProfileComponent extends BaseEditComponent {
  form = this.formBuilder.group({
    title: ['', [Validators.required]],
    authors: [''],
    summary: [''],
    thumbnail: [''],
  });
  thumbnails: Observable<{ uri: string; blob: SafeUrl }[]> = this.resource.pipe(
    map((res) => res.getThumbnails()),
    switchMap((thumbnails) =>
      forkJoin(
        thumbnails.map((thumbnail) =>
          this.sdk.nuclia.rest
            .getObjectURL(thumbnail.uri!)
            .pipe(map((url) => ({ uri: thumbnail.uri as string, blob: this.sanitizer.bypassSecurityTrustUrl(url) }))),
        ),
      ),
    ),
  );
  currentLabels: LabelValue[] = [];
  hintValues = this.resource.pipe(
    map((res) => ({
      RESOURCE: this.sdk.nuclia.rest.getFullUrl(res.path),
      DATA: JSON.stringify(this.getValue()),
    })),
  );

  constructor(
    protected route: ActivatedRoute,
    protected sdk: SDKService,
    protected formBuilder: UntypedFormBuilder,
    protected toaster: SisToastService,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
  ) {
    super(route, sdk, formBuilder, toaster);
  }

  updateForm(data: Resource): void {
    this.form.patchValue({
      title: data.title,
      summary: data.summary,
      authors: (data.origin?.colaborators || []).join(', '),
      thumbnail: data.thumbnail,
    });
    this.currentLabels = this.currentValue?.usermetadata?.classifications || [];
    this.cdr?.markForCheck();
  }

  updateLabels(labels: LabelValue[]) {
    this.currentLabels = labels;
    this.form.markAsDirty();
    this.cdr?.markForCheck();
  }

  getValue(): Partial<Resource> {
    return this.currentValue
      ? {
          title: this.form.value.title,
          summary: this.form.value.summary,
          thumbnail: this.form.value.thumbnail,
          usermetadata: { ...this.currentValue.usermetadata, classifications: this.currentLabels },
          origin: {
            ...this.currentValue.origin,
            colaborators: (this.form.value.authors as string).split(',').map((s) => s.trim()),
          },
        }
      : {};
  }
}
