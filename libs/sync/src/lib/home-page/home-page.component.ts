import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, ViewChild } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { PaTabsModule } from '@guillotinaweb/pastanaga-angular';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  imports: [CommonModule, PaTabsModule, RouterModule, TranslateModule],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent {
  private elementRef = inject(ElementRef<HTMLElement>);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
  );

  isConnectActive = computed(() => (this.currentUrl() ?? '').includes('/connect'));

  navigateTo(tab: 'synchronize' | 'connect') {
    this.router.navigate([tab === 'connect' ? tab : './'], { relativeTo: this.route });
    this.elementRef.nativeElement.scrollIntoView();
  }
}
