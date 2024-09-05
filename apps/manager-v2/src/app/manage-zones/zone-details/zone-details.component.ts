import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ZoneService } from '../zone.service';
import { Zone } from '../zone.models';
import { UserService } from '../../manage-users/user.service';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { filter, map, of, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Location } from '@angular/common';
import { TokenDialogComponent, ValidSlug } from '@flaps/common';

@Component({
  templateUrl: './zone-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoneDetailsComponent implements OnInit, OnDestroy {
  private unsubscribeAll = new Subject<void>();
  private zoneBackup?: Zone;

  zoneForm = new FormGroup({
    id: new FormControl('', { nonNullable: true }),
    slug: new FormControl('', { nonNullable: true, validators: [Validators.required, ValidSlug()] }),
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    subdomain: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    cloud_provider: new FormControl<'AWS' | 'GCP'>('GCP', { nonNullable: true, validators: [Validators.required] }),
    creator: new FormControl('', { nonNullable: true }),
    created: new FormControl('', { nonNullable: true }),
    modified: new FormControl('', { nonNullable: true }),
  });
  addZone = false;
  zoneTitle = '';
  isSaving = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private zoneService: ZoneService,
    private userService: UserService,
    private toast: SisToastService,
    private cdr: ChangeDetectorRef,
    private location: Location,
    private modalService: SisModalService,
  ) {}

  ngOnInit() {
    this.route.params
      .pipe(
        filter((params) => !!params['zoneId']),
        map((params) => params['zoneId'] as string),
        switchMap((zoneId) => (zoneId === 'add' ? of(undefined) : this.zoneService.getZone(zoneId))),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe((zone) => {
        if (zone) {
          this.zoneTitle = zone.title;
          this.zoneBackup = { ...zone };
          this.zoneForm.patchValue(zone);
        } else {
          this.addZone = true;
        }
        this.cdr.markForCheck();
      });
  }

  save() {
    this.isSaving = true;
    if (this.addZone) {
      const { slug, title, subdomain, cloud_provider } = this.zoneForm.getRawValue();
      this.userService
        .getAuthenticatedUser()
        .pipe(
          switchMap((user) => this.zoneService.addZone({ slug, title, creator: user.id, subdomain, cloud_provider })),
          tap((token) => {
            this.modalService.openModal(TokenDialogComponent, {
              dismissable: true,
              data: {
                token: token,
                modalTitle: 'Zone token',
                modalDescription: '<strong>Important!</strong> Copy and save the token.',
              },
            });
          }),
          switchMap(() => this.zoneService.loadZones()),
        )
        .subscribe({
          next: () => {
            this.goToZones();
          },
          error: () => {
            this.isSaving = false;
            this.toast.error('Add zone failed');
            this.cdr.markForCheck();
          },
        });
    } else {
      const { id, slug, title } = this.zoneForm.getRawValue();
      this.zoneService
        .updateZone(id, { slug, title })
        .pipe(switchMap(() => this.zoneService.getZone(id)))
        .subscribe({
          next: (zone) => {
            this.isSaving = false;
            this.zoneTitle = zone.title;
            this.zoneBackup = { ...zone };
            this.zoneForm.markAsPristine();
            this.cdr.markForCheck();
          },
          error: () => {
            this.isSaving = false;
            this.toast.error('Update zone failed');
            this.cdr.markForCheck();
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

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  goToZones() {
    this.router.navigate(['..'], { relativeTo: this.route });
  }

  goBack() {
    this.location.back();
  }
}
