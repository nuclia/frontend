import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  templateUrl: 'view-sync.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewSyncComponent {
  constructor() {}
}
