import { coerceBooleanProperty } from '@angular/cdk/coercion';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { FileDropDirective, FileSelectDirective } from '@flaps/core';

import { TranslatePipe } from '@ngx-translate/core';
import { SpinnerComponent } from '@nuclia/sistema';

@Component({
  selector: 'stf-dropzone',
  templateUrl: './dropzone.component.html',
  styleUrls: ['./dropzone.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FileDropDirective, FileSelectDirective, SpinnerComponent, TranslatePipe],
})
export class DropzoneComponent {
  @Input()
  set isUploading(value: any) {
    this._isUploading = coerceBooleanProperty(value);
  }
  get isUploading() {
    return this._isUploading;
  }

  @Output() file: EventEmitter<File> = new EventEmitter<File>();

  @ViewChild('fileInput') fileInput?: ElementRef;

  hasBaseDropZoneOver = false;
  private _isUploading = false;

  constructor(private cdr: ChangeDetectorRef) {}

  fileOverBase(overBase: boolean) {
    if (!this.isUploading) {
      this.hasBaseDropZoneOver = overBase;
      this.cdr?.markForCheck();
    }
  }

  chooseFiles($event: MouseEvent) {
    if (!this.isUploading) {
      $event.preventDefault();
      this.fileInput?.nativeElement?.click();
    }
  }

  uploadFile(files: File[]) {
    if (files.length > 0 && !this.isUploading) {
      this.file.next(files[0]);
    }
  }
}
