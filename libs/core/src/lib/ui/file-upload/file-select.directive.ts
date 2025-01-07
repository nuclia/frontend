import { Directive, ElementRef, HostListener, Output, EventEmitter } from '@angular/core';

// todo: filters

@Directive({
  selector: '[stfFileSelect]',
  standalone: false,
})
export class FileSelectDirective {
  @Output() atFileSelect: EventEmitter<File[]> = new EventEmitter<File[]>();

  protected element: ElementRef;

  public constructor(element: ElementRef) {
    this.element = element;
  }

  public isEmptyAfterSelection(): boolean {
    return !!this.element.nativeElement.attributes.multiple;
  }

  @HostListener('change')
  public onChange(): any {
    const files = this.element.nativeElement.files;

    this.atFileSelect.emit(files);
    if (this.isEmptyAfterSelection()) {
      // todo
      this.element.nativeElement.value = '';
    }
  }
}
