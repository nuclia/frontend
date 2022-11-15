import { Injectable } from '@angular/core';
import { SDKService } from '@flaps/core';
import { Widget, WidgetFeatures, WritableKnowledgeBox } from '@nuclia/core';
import { BehaviorSubject, map, Observable, switchMap } from 'rxjs';

export const DEFAULT_FEATURES: WidgetFeatures = {
  editLabels: true,
  entityAnnotation: true,
};

export const DEFAULT_FEATURES_LIST = Object.entries(DEFAULT_FEATURES)
  .filter(([, value]) => value)
  .map(([key]) => key)
  .join(',');

@Injectable({ providedIn: 'root' })
export class WidgetService {
  private _onUpdate = new BehaviorSubject<void>(undefined);
  widgets = this._onUpdate.pipe(
    switchMap(() => this.sdk.currentKb),
    switchMap((kb) => (kb as WritableKnowledgeBox).getWidgets()),
    map((widgets) => Object.values(widgets)),
  );

  constructor(private sdk: SDKService) {}

  updateWidgets() {
    this._onUpdate.next();
  }

  getWidgetInfo(widgetId: string): Observable<{ widget: Widget; kbId: string; kbState?: string; zone: string }> {
    return this.sdk.currentKb.pipe(
      switchMap((kb) =>
        (kb as WritableKnowledgeBox)
          .getWidget(widgetId)
          .pipe(
            map((widget) => ({ widget, kbId: kb.id, kbState: kb.state, zone: this.sdk.nuclia.options.zone || '' })),
          ),
      ),
    );
  }

  saveWidget(id: string, widget: Partial<Widget>): Observable<void> {
    return this.sdk.currentKb.pipe(switchMap((kb) => (kb as WritableKnowledgeBox).saveWidget(id, widget)));
  }

  deleteWidget(widgetId: string): Observable<void> {
    return this.sdk.currentKb.pipe(switchMap((kb) => (kb as WritableKnowledgeBox).deleteWidget(widgetId)));
  }
}
