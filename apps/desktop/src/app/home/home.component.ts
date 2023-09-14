import { ChangeDetectionStrategy, Component } from '@angular/core';
import { map } from 'rxjs';
import { SyncService } from '../sync/sync.service';
import { UserService } from '@flaps/core';

@Component({
  selector: 'nde-home',
  templateUrl: 'home.component.html',
  styleUrls: ['home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  username = this.user.userPrefs.pipe(map((prefs) => prefs?.name || ''));
  sources = this.sync.sourcesCache.pipe(map((sources) => Object.values(sources)));

  constructor(private sync: SyncService, private user: UserService) {}
}
