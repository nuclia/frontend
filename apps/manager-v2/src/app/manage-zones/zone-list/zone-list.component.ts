import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matAddRound, matDeleteRound } from '@ng-icons/material-icons/round';
import { UiConfirmService } from '@nuclia/ui/confirm-dialog';
import { UiInfiniteScroll } from '@nuclia/ui/infinite-scroll';
import { HlmButtonImports } from '@nuclia/ui-spartan/button';
import { HlmInputImports } from '@nuclia/ui-spartan/input';
import { HlmTableImports } from '@nuclia/ui-spartan/table';
import { toast } from '@spartan-ng/brain/sonner';
import { filter, switchMap } from 'rxjs';
import { ZoneSummary } from '../zone.models';
import { ZoneService } from '../zone.service';

@Component({
  templateUrl: './zone-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmButtonImports, HlmInputImports, HlmTableImports, NgIcon, RouterLink, UiInfiniteScroll],
  providers: [provideIcons({ matAddRound, matDeleteRound })],
})
export class ZoneListComponent {
  private zoneService = inject(ZoneService);
  private confirmService = inject(UiConfirmService);

  private allZones = toSignal(this.zoneService.zones, { initialValue: [] });
  private lastIndex = signal(100);

  filter = signal('');
  zones = computed(() => {
    const filterValue = this.filter();
    const zones = filterValue
      ? this.allZones().filter((zone) => zone.title.includes(filterValue) || zone.slug.includes(filterValue))
      : this.allZones();
    return zones.toSorted((a, b) => a.title.localeCompare(b.title)).slice(0, this.lastIndex());
  });

  onFilterInput(event: Event) {
    this.filter.set((event.target as HTMLInputElement).value);
  }

  onReachAnchor() {
    if (this.lastIndex() < this.allZones().length) {
      this.lastIndex.update((index) => index + 100);
    }
  }

  deleteZone(event: MouseEvent, zone: ZoneSummary) {
    event.preventDefault();
    event.stopPropagation();
    this.confirmService
      .confirm({
        title: `Are you sure you want to delete "${zone.slug}"?`,
        description: `You’re about to delete ${zone.slug}`,
        isDestructive: true,
        confirmLabel: 'Delete',
        cancelLabel: 'Cancel',
      })
      .pipe(
        filter((confirm) => !!confirm),
        switchMap(() => this.zoneService.deleteZone(zone.id)),
        switchMap(() => this.zoneService.loadZones()),
      )
      .subscribe({
        next: () => {
          /* empty */
        },
        error: () => toast.error('Zone deletion failed'),
      });
  }
}
