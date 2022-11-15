import { writableSubject } from '../state-lib';
import { filter, map, Observable } from 'rxjs';
import type { WidgetAction } from '../models';
import type { Widget } from '@nuclia/core';

let widgetActions: WidgetAction[] = [];
export const setWidgetActions = (actions: WidgetAction[]) => {
  widgetActions = actions;
};
export const getWidgetActions = () => widgetActions;

export const widgetType = writableSubject<'search' | 'viewer' | null>(null);
export const navigateToLink = writableSubject<boolean>(false);
export const searchWidget = writableSubject<Widget | null>(null);
export const customStyle: Observable<string> = searchWidget.pipe(
  map((widget) =>
    Object.entries(widget?.style || {})
      .filter(([k, v]) => !!v)
      .reduce((acc, [k, v]) => `${acc}--custom-${k}: ${v};`, ''),
  ),
);

export const canEditLabels = searchWidget.pipe(
  filter((widget) => !!widget),
  map((widget) => !!(widget as Widget).features.editLabels),
);

export const canAnnotateEntities = searchWidget.pipe(
  filter((widget) => !!widget),
  map((widget) => !!(widget as Widget).features.entityAnnotation),
);
