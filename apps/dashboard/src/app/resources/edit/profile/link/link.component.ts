import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-resource-link',
  templateUrl: 'link.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceLinkComponent {}
