import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { BehaviorSubject, combineLatest, filter, map, Observable, switchMap, take, tap } from 'rxjs';
import { ZoneSummary } from '../zone.models';
import { ZoneService } from '../zone.service';

@Component({
  templateUrl: './zone-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ZoneListComponent {
  private _allZones: Observable<ZoneSummary[]> = this.zoneService.zones;

  filter$: BehaviorSubject<string> = new BehaviorSubject<string>('');
  zones$: Observable<ZoneSummary[]> = combineLatest([this._allZones, this.filter$]).pipe(
    map(([zones, filter]) =>
      filter ? zones.filter((zone) => zone.title.includes(filter) || zone.slug.includes(filter)) : zones,
    ),
    map((zones) => zones.sort((a, b) => a.title.localeCompare(b.title))),
    tap(() => this.cdr.markForCheck()),
  );

  lastIndex = 100;

  constructor(
    private cdr: ChangeDetectorRef,
    private zoneService: ZoneService,
    private modalService: SisModalService,
    private toast: SisToastService,
  ) {}

  onReachAnchor() {
    this._allZones.pipe(take(1)).subscribe((zones) => {
      if (this.lastIndex < zones.length) {
        this.lastIndex = this.lastIndex + 100;
        this.cdr.markForCheck();
      }
    });
  }

  deleteZone(event: MouseEvent, zone: ZoneSummary) {
    event.preventDefault();
    event.stopPropagation();
    this.modalService
      .openConfirm({
        title: `Are you sure you want to delete "${zone.slug}"?`,
        description: `You’re about to delete ${zone.slug}`,
        isDestructive: true,
        confirmLabel: 'Delete',
        cancelLabel: 'Cancel',
      })
      .onClose.pipe(
        filter((confirm) => !!confirm),
        switchMap(() => this.zoneService.deleteZone(zone.id)),
        switchMap(() => this.zoneService.loadZones()),
      )
      .subscribe({
        next: () => {},
        error: () => this.toast.error('Zone deletion failed'),
      });
  }
}
