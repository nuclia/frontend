import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'stf-upload-option',
  templateUrl: './upload-option.component.html',
  styleUrls: ['./upload-option.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadOptionComponent {
  @Input() icon?: string;
  @Input() text?: string;
}
