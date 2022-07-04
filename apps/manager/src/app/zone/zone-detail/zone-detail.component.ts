import { Component } from '@angular/core';
import { formatDate } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { Zone, ZonePatch, ZoneAdd } from '../../models/zone.model';
import { ZoneService } from '../../services/zone.service';
import { SDKService } from '@flaps/core';

@Component({
  selector: 'app-zone-detail',
  templateUrl: './zone-detail.component.html',
  styleUrls: ['./zone-detail.component.scss'],
})
export class ZoneDetailComponent {
  edit: boolean = false;
  zone: Zone | null = null;

  message: string | undefined;

  form = this.fb.group({
    id: [{ value: '', disabled: true }],
    slug: ['', [Validators.required]],
    title: ['', [Validators.required]],
    creator: [{ value: '', disabled: true }],
    account: [{ value: '', disabled: true }],
    created: [{ value: '', disabled: true }],
    modified: [{ value: '', disabled: true }],
    external: [{ value: '', disabled: true }],
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private zoneService: ZoneService,
    private sdk: SDKService,
    private fb: UntypedFormBuilder,
  ) {
    this.route.data.subscribe((data) => {
      const zone = data.zone as Zone | null;
      if (zone) {
        this.zone = zone;
        this.edit = true;
        const formValues = {
          slug: zone.slug,
          title: zone.title,
          creator: zone.creator,
          account: zone.account,
          created: zone.created && formatDate(zone.created, 'dd/LL/yyyy HH:mm', 'en-US'),
          modified: zone.modified && formatDate(zone.modified, 'dd/LL/yyyy HH:mm', 'en-US'),
          external: zone.external ? 'Yes' : 'No',
        };
        this.form.patchValue(formValues);
      }
    });
  }

  editZone() {
    if (this.form.valid) {
      const data: ZonePatch = {
        slug: this.form.controls.slug.value,
        title: this.form.controls.title.value,
      };
      this.zoneService.edit(this.zone!.id, data).subscribe(
        () => {
          this.returnToZones();
        },
        (err: any) => {
          if (err.error) {
            this.message = err.error.message;
          } else {
            this.message = err.message;
          }
        },
      );
    }
  }

  addZone() {
    if (this.form.valid) {
      const newZone: ZoneAdd = {
        slug: this.form.controls.slug.value,
        title: this.form.controls.title.value,
        creator: this.sdk.nuclia.auth.getJWTUser()?.sub || '',
      };
      this.zoneService.create(newZone).subscribe(
        () => {
          this.returnToZones();
        },
        (err: any) => {
          if (err.error) {
            this.message = err.error.message;
          } else {
            this.message = err.message;
          }
        },
      );
    }
  }

  returnToZones() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }
}
