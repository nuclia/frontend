import { booleanAttribute, ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { PaButtonModule, PaTooltipModule } from '@guillotinaweb/pastanaga-angular';
import { ItemToUpload } from '../getting-started.models';
import { ProgressBarComponent } from '@nuclia/sistema';
import { FormatETAPipe } from '@flaps/common';

@Component({
  selector: 'app-getting-started-upload-list',
  imports: [CommonModule, TranslateModule, PaButtonModule, PaTooltipModule, ProgressBarComponent],
  templateUrl: './upload-list.component.html',
  styleUrl: './upload-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadListComponent {
  @Input() itemsToUpload: ItemToUpload[] = [];
  @Input({ transform: booleanAttribute }) canDelete = false;

  @Output() removeItem = new EventEmitter<string>();

  formatETA: FormatETAPipe = new FormatETAPipe();
}
