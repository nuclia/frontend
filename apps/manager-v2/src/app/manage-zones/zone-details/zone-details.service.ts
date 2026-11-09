import { Location } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ValidSlug } from '@flaps/common';
import { UiToastService } from '@nuclia/ui/toast';
import { HlmDialogService } from '@nuclia/ui-spartan/dialog';
import { filter, map, of, switchMap, tap } from 'rxjs';
import { UserService } from '../../manage-users/user.service';
import { ZoneTokenDialogComponent } from '../zone-token-dialog/zone-token-dialog.component';
import { Zone } from '../zone.models';
import { ZoneService } from '../zone.service';

@Injectable()
export class ZoneDetailsService {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private zoneService = inject(ZoneService);
  private userService = inject(UserService);
  private toast = inject(UiToastService);
  private location = inject(Location);
  private dialogService = inject(HlmDialogService);
  private zoneBackup?: Zone;

  zoneForm = new FormGroup({
    id: new FormControl('', { nonNullable: true }),
    slug: new FormControl('', { nonNullable: true, validators: [Validators.required, ValidSlug()] }),
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    cloud_provider: new FormControl<'AWS' | 'GCP'>('GCP', { nonNullable: true, validators: [Validators.required] }),
    private: new FormControl(false, { nonNullable: true }),
    origin: new FormControl<string | null>(null, { nonNullable: false }),
    creator: new FormControl('', { nonNullable: true }),
    created: new FormControl('', { nonNullable: true }),
    modified: new FormControl('', { nonNullable: true }),
  });
  addZone = signal(false);
  zoneTitle = signal('');
  isSaving = signal(false);
  zoneId = signal('');

  constructor() {
    this.route.params
      .pipe(
        filter((params) => !!params['zoneId']),
        map((params) => params['zoneId'] as string),
        switchMap((zoneId) => {
          if (zoneId === 'add') {
            return of(undefined);
          }
          this.zoneId.set(zoneId);
          return this.zoneService.getZone(zoneId);
        }),
        takeUntilDestroyed(),
      )
      .subscribe((zone) => {
        if (zone) {
          this.zoneTitle.set(zone.title);
          this.zoneBackup = { ...zone };
          this.zoneForm.patchValue(zone);
        } else {
          this.addZone.set(true);
        }
      });
  }

  save() {
    this.isSaving.set(true);
    if (this.addZone()) {
      const { slug, title, cloud_provider, private: isPrivate, origin } = this.zoneForm.getRawValue();
      this.userService
        .getAuthenticatedUser()
        .pipe(
          switchMap((user) =>
            this.zoneService.addZone({
              slug,
              title,
              creator: user.id,
              cloud_provider,
              private: isPrivate,
              origin: origin || null,
            }),
          ),
          tap((token) => this.dialogService.open(ZoneTokenDialogComponent, { context: { token } })),
          switchMap(() => this.zoneService.loadZones()),
        )
        .subscribe({
          next: () => {
            this.goToZones();
          },
          error: () => {
            this.isSaving.set(false);
            this.toast.error('Add zone failed');
          },
        });
    } else {
      const { id, slug, title, private: isPrivate, origin } = this.zoneForm.getRawValue();
      this.zoneService
        .updateZone(id, { slug, title, private: isPrivate, origin: origin || null })
        .pipe(switchMap(() => this.zoneService.getZone(id)))
        .subscribe({
          next: (zone) => {
            this.isSaving.set(false);
            this.zoneTitle.set(zone.title);
            this.zoneBackup = { ...zone };
            this.zoneForm.markAsPristine();
          },
          error: () => {
            this.isSaving.set(false);
            this.toast.error('Update zone failed');
          },
        });
    }
  }

  reset() {
    if (this.zoneBackup) {
      this.zoneForm.patchValue(this.zoneBackup);
      this.zoneForm.markAsPristine();
    }
  }

  goToZones() {
    this.router.navigate(['..'], { relativeTo: this.route });
  }

  goBack() {
    this.location.back();
  }
}
