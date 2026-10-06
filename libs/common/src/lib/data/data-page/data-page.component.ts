import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { FeaturesService, UploadService } from '@flaps/core';
import { PaButtonModule, PaTabsModule } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { BadgeComponent } from '@nuclia/sistema';
import { filter, map, startWith } from 'rxjs';

@Component({
  selector: 'stf-data-page',
  imports: [RouterOutlet, CommonModule, BadgeComponent, PaButtonModule, PaTabsModule, TranslatePipe],
  templateUrl: './data-page.component.html',
  styleUrl: './data-page.component.scss',
})
export class DataPageComponent {
  private elementRef = inject(ElementRef<HTMLElement>);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private features = inject(FeaturesService);
  private uploadService = inject(UploadService);

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
    // TO DO: review routes
    this.router.navigate([tab === 'synchronize' ? './' : tab], { relativeTo: this.route });
    this.elementRef.nativeElement.scrollIntoView();
  }

  refreshResources() {
    this.uploadService.updateAfterUploads().subscribe();
  }
}
