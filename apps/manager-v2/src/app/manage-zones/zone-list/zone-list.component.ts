import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { BehaviorSubject, combineLatest, filter, map, Observable, switchMap } from 'rxjs';
import { ZoneSummary } from '../zone.models';
import { ZoneService } from '../zone.service';

@Component({
  templateUrl: './zone-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoneListComponent {
  private _allZones: BehaviorSubject<ZoneSummary[]> = new BehaviorSubject<ZoneSummary[]>([]);

  filter$: BehaviorSubject<string> = new BehaviorSubject<string>('');
  zones$: Observable<ZoneSummary[]> = combineLatest([this._allZones, this.filter$]).pipe(
    map(([zones, filter]) =>
      filter ? zones.filter((zone) => zone.title.includes(filter) || zone.slug.includes(filter)) : zones,
    ),
    map((zones) => zones.sort((a, b) => a.title.localeCompare(b.title))),
  );

  lastIndex = 100;

  constructor(
    private zoneService: ZoneService,
    private modalService: SisModalService,
    private toast: SisToastService,
  ) {
    this.loadZones();
  }

  onReachAnchor() {
    if (this.lastIndex < this._allZones.getValue().length) {
      this.lastIndex = this.lastIndex + 100;
    }
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
      )
      .subscribe({
        next: () => this.loadZones(),
        error: () => this.toast.error('Zone deletion failed'),
      });
  }

  private loadZones() {
    this.zoneService.getZones().subscribe((zones) => this._allZones.next(zones));
  }
}
