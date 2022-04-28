import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

let nextId = 0;

@Component({
  selector: 'stf-image',
  templateUrl: './image.component.html',
  styleUrls: ['./image.component.scss'],
})
export class ImageComponent implements OnInit {
  show_editable: boolean = false;
  @Input() editable: EventEmitter<boolean> | undefined;
  @Input() id: string | undefined;
  @Input() name: string | undefined;
  @Input() field: string | undefined;
  @Input() behavior: string | undefined;
  @Input() key: string | undefined;

  @Input() width: string = '80px';
  @Input() height: string = '50px';

  @Input()
  get value(): string {
    return this._value;
  }
  set value(v: string) {
    if (this.originvalue === undefined) {
      this.originvalue = v;
    }
    this._value = v;
  }

  @Input() base_b64: boolean = false;

  @Output() change: EventEmitter<any> = new EventEmitter();

  _value: string = 'assets/images/default_image.jpg';

  pending: boolean = false;
  hasError = false;
  originvalue: string | undefined;

  constructor() {}

  ngOnInit(): void {
    this.editable?.subscribe((val: boolean) => {
      this.show_editable = val;
    });
    this.id = !!this.id ? `${this.id}-image` : `image-${nextId++}`;
    this.name = this.name || this.id;
  }
  chooseFiles($event: any) {
    if (this.id) {
      document.getElementById(this.id)?.click();
    }
  }

  onFileChange(event: Event) {
    const reader = new FileReader();
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length) {
      const file: File = (target.files as FileList)[0];
      reader.onload = (e) => {
        const img = new Image();
        img.src = (<FileReader>e.target).result as string;
        img.onload = () => {
          const elem = document.createElement('canvas');
          elem.width = parseInt(this.width.replace('px', ''));
          elem.height = parseInt(this.height.replace('px', ''));
          const ctx = elem.getContext('2d');
          ctx?.drawImage(img, 0, 0, elem.width, elem.height);
          const data = ctx?.canvas.toDataURL();
          if (data) {
            this.base_b64 = true;
            this.value = data;
            this.pending = true;
          }
        };
      };
      reader.readAsDataURL(file);
    }
  }

  save() {
    this.change.emit({
      bhr: this.behavior,
      field: this.field,
      op: 'set',
      value: this.value,
      key: this.key,
    });
    this.pending = false;
    this.originvalue = this.value;
  }

  clean() {
    this.change.emit({
      bhr: this.behavior,
      field: this.field,
      op: 'set',
      value: undefined,
      key: this.key,
    });
    this.pending = false;
    if (this.originvalue) {
      this.value = this.originvalue;
    }
  }
}
