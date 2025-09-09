import { Directive, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { getDroppedFiles } from './file-drop.utils';

export type DroppedFile = File & { relativePath: string };
const extensionRegexp = new RegExp(`^\.[a-zA-Z0-9]+$`);

@Directive({
  selector: '[stfFileDrop]',
  standalone: false,
})
export class FileDropDirective {
  public constructor(element: ElementRef) {
    this.element = element;
  }

  /**
   * Based on <input type="file"> accept property.
   * See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#unique_file_type_specifiers
   *
   * @param value: string containing one or more of these unique file type specifier as its value, separated by comma.
   *  - A valid case-insensitive filename extension, starting with a period (".") character. For example: .jpg, .pdf, or .doc.
   *  - The string audio/* meaning "any audio file".
   *  - The string video/* meaning "any video file".
   *  - The string image/* meaning "any image file".
   */
  @Input() set fileDropAccept(value: string | undefined) {
    if (value) {
      this._fileTypeSpecifiers = value
        .split(',')
        .filter(
          (specifier) =>
            specifier === 'audio/*' ||
            specifier === 'video/*' ||
            specifier === 'image/*' ||
            specifier.match(extensionRegexp),
        )
        .map((specifier) => {
          if (specifier.includes('/*')) {
            return specifier.split('/*')[0];
          }
          return specifier;
        });
    }
  }

  @Output() public fileOver: EventEmitter<boolean> = new EventEmitter();
  @Output() public atFileDrop: EventEmitter<DroppedFile[]> = new EventEmitter<DroppedFile[]>();

  protected element: ElementRef;
  private _fileTypeSpecifiers: string[] = [];

  @HostListener('drop', ['$event'])
  public onDrop(event: DragEvent): void {
    const transfer = event.dataTransfer;
    if (!transfer) {
      return;
    }
    this._preventAndStop(event);
    this.fileOver.emit(false);
    getDroppedFiles(transfer.items).subscribe((files) => {
      let acceptedFiles: DroppedFile[] = files;
      let unacceptedFiles: DroppedFile[] = [];
      if (this._fileTypeSpecifiers.length > 0) {
        acceptedFiles = [];
        files.forEach((file) => {
          const matchAcceptedType = this._fileTypeSpecifiers.some((specifier) =>
            specifier.includes('.') ? file.name.endsWith(specifier) : file.type.startsWith(specifier),
          );
          if (matchAcceptedType) {
            acceptedFiles.push(file);
          } else {
            unacceptedFiles.push(file);
          }
        });
      }
      if (unacceptedFiles.length > 0) {
        console.warn(
          `The following files didn't match the accepted type "${this._fileTypeSpecifiers.join(',')}":`,
          unacceptedFiles,
        );
      }
      this.atFileDrop.emit(acceptedFiles);
    });
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
