import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { PaTabsModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { filter, map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-kb-settings-layout',
  templateUrl: './kb-settings-layout.component.html',
  styleUrl: './kb-settings-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaTabsModule, RouterOutlet, TranslatePipe, TranslateModule],
})
export class KbSettingsLayoutComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
  );

  isKvSchemasActive = computed(() => (this.currentUrl() ?? '').includes('/kv-schemas'));

  navigateTo(tab: 'general' | 'kv-schemas') {
    this.router.navigate([tab], { relativeTo: this.route });
  }
}
