import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, ViewChild } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { PaTabsModule } from '@guillotinaweb/pastanaga-angular';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { FeaturesService } from '@flaps/core';
import { BadgeComponent } from '@nuclia/sistema';

@Component({
  imports: [CommonModule, BadgeComponent, PaTabsModule, RouterModule, TranslateModule],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent {
  private elementRef = inject(ElementRef<HTMLElement>);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private features = inject(FeaturesService);

  private activeChildPath = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.route.snapshot.firstChild?.routeConfig?.path ?? ''),
      startWith(this.route.snapshot.firstChild?.routeConfig?.path ?? ''),
    ),
    { initialValue: '' },
  );

  isAgenticSearchEnabled = toSignal(this.features.unstable.agenticSearch, { initialValue: false });
  // Matched against the exact route config path segment (defined in sync.routes.ts) rather than a
  // substring of the full URL, so this can't false-positive on an unrelated route that happens to
  // contain "resources"/"connect" somewhere in its path.
  isResourcesActive = computed(() => this.activeChildPath() === 'resources');
  isConnectActive = computed(() => this.activeChildPath() === 'connect');
  isSyncActive = computed(() => this.activeChildPath() === '');

  navigateTo(tab: 'resources' | 'synchronize' | 'connect') {
    this.router.navigate([tab === 'synchronize' ? './' : tab], { relativeTo: this.route });
    this.elementRef.nativeElement.scrollIntoView();
  }
}
