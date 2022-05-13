import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map, mergeMap } from 'rxjs';
import { SyncService } from '../sync/sync.service';

@Component({
  selector: 'da-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent {
  constructor(private router: Router, private sync: SyncService) {
    if (!this.sync.getAccount()) {
      this.router.navigate(['/select']);
    }
  }
}
