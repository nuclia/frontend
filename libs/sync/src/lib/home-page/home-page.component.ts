import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, ViewChild } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { PaTabsModule } from '@guillotinaweb/pastanaga-angular';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { FeaturesService } from '@flaps/core';
import { BadgeComponent } from '@nuclia/sistema';
import { UploadButtonComponent } from '@flaps/common';

@Component({
  imports: [CommonModule, BadgeComponent, PaTabsModule, RouterModule, TranslateModule, UploadButtonComponent],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent {
  private elementRef = inject(ElementRef<HTMLElement>);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private features = inject(FeaturesService);

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
  );

  isAgenticSearchEnabled = toSignal(this.features.unstable.agenticSearch, { initialValue: false });
  isResourcesActive = computed(() => (this.currentUrl() ?? '').includes('/resources'));
  isConnectActive = computed(() => (this.currentUrl() ?? '').includes('/connect'));
  isSyncActive = computed(() => !this.isResourcesActive() && !this.isConnectActive());

  navigateTo(tab: 'resources' | 'synchronize' | 'connect') {
    this.router.navigate([tab === 'synchronize' ? './' : tab], { relativeTo: this.route });
    this.elementRef.nativeElement.scrollIntoView();
  }
}
