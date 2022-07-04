import { Directive, EventEmitter, ElementRef, HostListener, Output } from '@angular/core';
import { getDroppedFiles } from './file-drop.utils';

@Directive({ selector: '[stfFileDrop]' })
export class FileDropDirective {
  public constructor(element: ElementRef) {
    this.element = element;
  }
  @Output() public fileOver: EventEmitter<any> = new EventEmitter();
  @Output() public atFileDrop: EventEmitter<File[]> = new EventEmitter<File[]>();

  protected element: ElementRef;

  @HostListener('drop', ['$event'])
  public onDrop(event: DragEvent): void {
    const transfer = event.dataTransfer;
    if (!transfer) {
      return;
    }
    this._preventAndStop(event);
    this.fileOver.emit(false);
    getDroppedFiles(transfer.items).subscribe((files: File[]) => this.atFileDrop.emit(files));
  }

  @HostListener('dragover', ['$event'])
  public onDragOver(event: any): void {
    const transfer = this._getTransfer(event);
    if (!this._haveFiles(transfer.types)) {
      return;
    }

    transfer.dropEffect = 'copy';
    this._preventAndStop(event);
    this.fileOver.emit(true);
  }

  @HostListener('dragleave', ['$event'])
  public onDragLeave(event: any): any {
    console.log('dragleave');
    if ((this as any).element) {
      if (event.currentTarget === (this as any).element[0]) {
        return;
      }
    }

    this._preventAndStop(event);
    this.fileOver.emit(false);
  }

  protected _getTransfer(event: any): any {
    return event.dataTransfer ? event.dataTransfer : event.originalEvent.dataTransfer; // jQuery fix;
  }

  protected _preventAndStop(event: any): any {
    event.preventDefault();
    event.stopPropagation();
  }

  protected _haveFiles(types: any): any {
    if (!types) {
      return false;
    }

    if (types.indexOf) {
      return types.indexOf('Files') !== -1;
    } else if (types.contains) {
      return types.contains('Files');
    } else {
      return false;
    }
  }
}
