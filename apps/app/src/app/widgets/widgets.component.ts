import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { STFTrackingService, SDKService } from '@flaps/core';
import { filter, map, switchMap } from 'rxjs';
import { AddWidgetDialogComponent } from './add/add-widget.component';
import { WidgetService } from './widget.service';
import { NavigationService } from '../services/navigation.service';
import { AppService } from '../services/app.service';

const DEFAULT_WIDGET = 'dashboard';
@Component({
  selector: 'app-widgets',
  templateUrl: 'widgets.component.html',
  styleUrls: ['widgets.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetsComponent implements OnDestroy {
  routes = this.widgetService.widgets.pipe(
    map((widgets) => {
      widgets = widgets.sort((a, b) =>
        a.id === DEFAULT_WIDGET ? -1 : b.id === DEFAULT_WIDGET ? 1 : a.id.localeCompare(b.id),
      );
      return widgets.map((widget) => ({
        title: widget.id === DEFAULT_WIDGET ? 'Dashboard widget' : widget.id,
        relativeRoute: widget.id,
      }));
    }),
  );
  showLink = this.sdk.currentKb.pipe(map((kb) => !!kb.admin && kb.state === 'PRIVATE'));
  homeUrl = this.navigation.homeUrl;

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
    private widgetService: WidgetService,
    private tracking: STFTrackingService,
    private sdk: SDKService,
    private navigation: NavigationService,
    private appService: AppService,
  ) {
    this.appService.setSearchEnabled(false);
  }

  addWidget() {
    this.dialog
      .open(AddWidgetDialogComponent, { width: '530px' })
      .afterClosed()
      .pipe(
        filter((result) => !!result && !!result.id),
        switchMap((result) => {
          this.tracking.logEvent('add_widget');
          const id = result.id as string;
          return this.widgetService
            .saveWidget(id, {
              id,
              mode: 'button',
            })
            .pipe(map(() => result.id));
        }),
      )
      .subscribe((id) => {
        this.widgetService.updateWidgets();
        this.router.navigate([id], { relativeTo: this.route });
      });
  }

  ngOnDestroy() {
    setTimeout(() => {
      // Wait until the component is destroyed
      this.appService.setSearchEnabled(true);
    }, 100);
  }
}
