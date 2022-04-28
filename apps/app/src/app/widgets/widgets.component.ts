import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { STFTrackingService } from '@flaps/auth';
import { filter, map, switchMap } from 'rxjs';
import { AddWidgetDialogComponent } from './add/add-widget.component';
import { WidgetService } from './widget.service';

const DEFAULT_WIDGET = 'dashboard';
@Component({
  selector: 'app-widgets',
  templateUrl: 'widgets.component.html',
  styleUrls: ['widgets.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetsComponent {
  routes = this.widgetService.widgets.pipe(
    map((widgets) => {
      widgets = widgets.sort((a, b) =>
        a.id === DEFAULT_WIDGET ? -1 : b.id === DEFAULT_WIDGET ? 1 : a.id.localeCompare(b.id)
      );
      return widgets.map((widget) => ({
        title: widget.id === DEFAULT_WIDGET ? 'Dashboard widget' : widget.id,
        relativeRoute: widget.id,
      }));
    })
  );

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
    private widgetService: WidgetService,
    private tracking: STFTrackingService
  ) {}

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
        })
      )
      .subscribe((id) => {
        this.widgetService.updateWidgets();
        this.router.navigate([id], { relativeTo: this.route });
      });
  }
}
