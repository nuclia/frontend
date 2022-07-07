import { Component, ChangeDetectionStrategy, forwardRef, ChangeDetectorRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'nde-folder-upload',
  templateUrl: './folder-upload.component.html',
  styleUrls: ['./folder-upload.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FolderUploadComponent),
      multi: true,
    },
  ],
})
export class FolderUploadComponent implements ControlValueAccessor {
  files: File[] = [];
  hasFileOver = false;
  onChange: (value: File[]) => void;
  onTouch: () => void;

  constructor(private cdr: ChangeDetectorRef) {}

  addFiles(files: File[] | FileList) {
    files = [...Array.from(files)];
    this.files = files;
    this.cdr.markForCheck();
    this.onChange(files);
    this.onTouch();
  }

  writeValue(value: any): void {
    if (value) {
      this.files = value;
    } else {
      this.files = [];
    }
  }

  registerOnChange(fn: (value: File[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }
}
