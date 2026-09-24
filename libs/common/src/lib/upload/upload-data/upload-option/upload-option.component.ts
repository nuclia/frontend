import { booleanAttribute, ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { PaIconModule, trimString } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'stf-upload-option',
  templateUrl: './upload-option.component.html',
  styleUrls: ['./upload-option.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaIconModule, TranslatePipe],
})
export class UploadOptionComponent {
  @Input({ transform: trimString }) icon = '';
  @Input({ transform: trimString }) text = '';
  @Input({ transform: booleanAttribute }) active = false;
}
