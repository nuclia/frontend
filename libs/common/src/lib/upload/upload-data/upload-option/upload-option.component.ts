import { booleanAttribute, ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { trimString } from '@guillotinaweb/pastanaga-angular';

@Component({
  selector: 'stf-upload-option',
  templateUrl: './upload-option.component.html',
  styleUrls: ['./upload-option.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class UploadOptionComponent {
  @Input({ transform: trimString }) icon = '';
  @Input({ transform: trimString }) text = '';
  @Input({ transform: booleanAttribute }) active = false;
}
