import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ZoneService } from '../zone.service';
import { Zone, ZoneAccountEntry } from '../zone.models';
import { UserService } from '../../manage-users/user.service';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { filter, map, of, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Location } from '@angular/common';
import { TokenDialogComponent, ValidSlug } from '@flaps/common';

@Component({
  templateUrl: './zone-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ZoneDetailsComponent implements OnInit, OnDestroy {
  private unsubscribeAll = new Subject<void>();
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
  addZone = false;
  zoneTitle = '';
  isSaving = false;
  zoneId = '';
  grantedAccounts: ZoneAccountEntry[] = [];
  newAccountId = '';
  isGranting = false;

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
        switchMap((zoneId) => {
          if (zoneId === 'add') {
            return of(undefined);
          }
          this.zoneId = zoneId;
          return this.zoneService.getZone(zoneId);
        }),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe((zone) => {
        if (zone) {
          this.zoneTitle = zone.title;
          this.zoneBackup = { ...zone };
          this.zoneForm.patchValue(zone);
          this.loadGrantedAccounts();
        } else {
          this.addZone = true;
        }
        this.cdr.markForCheck();
      });
  }

  loadGrantedAccounts() {
    if (!this.zoneId) return;
    this.zoneService.getZoneAccounts(this.zoneId).subscribe({
      next: (accounts) => {
        this.grantedAccounts = accounts;
        this.cdr.markForCheck();
      },
      error: () => this.toast.error('Failed to load granted accounts'),
    });
  }

  grantAccount() {
    const accountId = this.newAccountId.trim();
    if (!accountId || !this.zoneId) return;
    this.isGranting = true;
    this.zoneService.grantZoneToAccount(this.zoneId, accountId).subscribe({
      next: () => {
        this.newAccountId = '';
        this.isGranting = false;
        this.loadGrantedAccounts();
      },
      error: () => {
        this.isGranting = false;
        this.toast.error('Failed to grant account access');
        this.cdr.markForCheck();
      },
    });
  }

  revokeAccount(accountId: string) {
    if (!this.zoneId) return;
    this.zoneService.revokeZoneFromAccount(this.zoneId, accountId).subscribe({
      next: () => this.loadGrantedAccounts(),
      error: () => this.toast.error('Failed to revoke account access'),
    });
  }

  save() {
    this.isSaving = true;
    if (this.addZone) {
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
      const { id, slug, title, private: isPrivate, origin } = this.zoneForm.getRawValue();
      this.zoneService
        .updateZone(id, { slug, title, private: isPrivate, origin: origin || null })
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
