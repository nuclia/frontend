import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-tasks-automation',
  imports: [CommonModule, RouterOutlet],
  template: '<router-outlet></router-outlet>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasksAutomationComponent implements OnDestroy {
  private unsubscribeAll = new Subject<void>();

  constructor(private router: Router) {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe(() => {
        // Scroll back to top on navigation (don't know why but our scrollPositionRestoration configuration isn't working on those pages)
        document.querySelector('.dashboard-content > main')?.scrollTo(0, 0);
      });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
