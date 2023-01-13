import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-resource-file',
  templateUrl: 'file.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceFileComponent {}
