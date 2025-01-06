import { booleanAttribute, ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'stf-thumbnail',
  templateUrl: './thumbnail.component.html',
  styleUrls: ['./thumbnail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ThumbnailComponent {
  @Input() url: SafeUrl | string | undefined;
  @Input() alt: string | undefined;
  @Input({ transform: booleanAttribute }) selected = false;
  @Input({ transform: booleanAttribute }) disabled = false;
  @Input({ transform: booleanAttribute }) noDeletion = false;

  @Output() select = new EventEmitter<string>();
  @Output() delete = new EventEmitter<string>();

  onSelect() {
    if (this.url) {
      this.select.emit(this.url as string);
    }
  }

  onDelete($event: Event) {
    if (!this.selected && !this.disabled) {
      $event.stopPropagation();
      $event.preventDefault();
      if (this.url) {
        this.delete.emit(this.url as string);
      }
    }
  }
}
