import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ValidSlug } from '@flaps/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matArrowBackRound, matDeleteRound } from '@ng-icons/material-icons/round';
import { UiToastService } from '@nuclia/ui/toast';
import { HlmDialogService } from '@nuclia/ui-spartan/dialog';
import { HlmButtonImports } from '@nuclia/ui-spartan/button';
import { HlmCheckboxImports } from '@nuclia/ui-spartan/checkbox';
import { HlmFieldImports } from '@nuclia/ui-spartan/field';
import { HlmInputImports } from '@nuclia/ui-spartan/input';
import { HlmSelectImports } from '@nuclia/ui-spartan/select';
import { filter, map, of, switchMap, tap } from 'rxjs';
import { UserService } from '../../manage-users/user.service';
import { ZoneTokenDialogComponent } from '../zone-token-dialog/zone-token-dialog.component';
import { Zone, ZoneAccountEntry } from '../zone.models';
import { ZoneService } from '../zone.service';

@Component({
  templateUrl: './zone-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    HlmButtonImports,
    HlmCheckboxImports,
    HlmFieldImports,
    HlmInputImports,
    HlmSelectImports,
    NgIcon,
    ReactiveFormsModule,
  ],
  providers: [provideIcons({ matArrowBackRound, matDeleteRound })],
})
export class ZoneDetailsComponent {
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
  zoneId = '';
  grantedAccounts = signal<ZoneAccountEntry[]>([]);
  newAccountId = '';
  isGranting = signal(false);

  constructor() {
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
        takeUntilDestroyed(),
      )
      .subscribe((zone) => {
        if (zone) {
          this.zoneTitle.set(zone.title);
          this.zoneBackup = { ...zone };
          this.zoneForm.patchValue(zone);
          this.loadGrantedAccounts();
        } else {
          this.addZone.set(true);
        }
      });
  }

  loadGrantedAccounts() {
    if (!this.zoneId) return;
    this.zoneService.getZoneAccounts(this.zoneId).subscribe({
      next: (accounts) => this.grantedAccounts.set(accounts),
      error: () => this.toast.error('Failed to load granted accounts'),
    });
  }

  grantAccount() {
    const accountId = this.newAccountId.trim();
    if (!accountId || !this.zoneId) return;
    this.isGranting.set(true);
    this.zoneService.grantZoneToAccount(this.zoneId, accountId).subscribe({
      next: () => {
        this.newAccountId = '';
        this.isGranting.set(false);
        this.loadGrantedAccounts();
      },
      error: () => {
        this.isGranting.set(false);
        this.toast.error('Failed to grant account access');
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
