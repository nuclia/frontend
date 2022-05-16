import { Component, OnInit, ElementRef, Input, Output, EventEmitter } from '@angular/core';

interface EntityValue {
  key: string;
  value: string;
}

@Component({
  selector: 'stf-tag',
  templateUrl: './tag.component.html',
  styleUrls: ['./tag.component.scss'],
})
export class STFTagComponent implements OnInit {
  @Input() value: string | undefined;
  @Input() entity: EntityValue | undefined;
  @Input() prob: number | undefined;

  @Input() mode = 'edit';

  @Output() add: EventEmitter<string>;
  @Output() del: EventEmitter<string>;

  type: string | undefined;
  text: string | undefined;
  class: string | undefined;
  @Input() action: boolean = false;
  background: string;
  padding: string;
  color: string;
  margin: string;
  constructor(private elementRef: ElementRef) {
    this.background = '#ccc';
    this.padding = '6px';
    this.color = 'black';
    this.margin = '1px';
    this.add = new EventEmitter();
    this.del = new EventEmitter();
  }

  ngOnInit() {
    if (this.value) {
      if (this.value.indexOf('/') > -1) {
        const values = this.value.split('/');
        this.type = values[0];
        if (values.length === 3) {
          this.class = values[1];
          this.text = values[2];
        } else {
          this.text = values[1];
        }
      }

      if (this.type === 'l') {
        this.background = '#f19292';
      }
      if (this.type === 'o') {
        this.background = '#00ff13';
      }
      if (this.type === 'n') {
        this.class = 'has';
        this.background = '#6699ff';
        this.color = 'black';
      }
      if (this.type === 'e') {
        this.class = 'entity';
        this.background = '#ff9955';
        this.color = 'black';
      }
      if (this.type === 's') {
        this.class = 'solution';
        this.background = '#3399aa';
        this.color = 'white';
      }
      if (this.type === 'application') {
        this.background = '#ff9966';
        this.color = 'white';
      }
      if (this.class) {
        this.padding = '2px';
        this.margin = '7px';
      }
    }
    if (this.entity) {
      this.class = this.entity.key;
      this.text = this.entity.value;
      this.background = '#f19292';
      this.margin = '7px';
    }
  }

  addElement() {
    this.add.emit(this.value);
  }

  delElement() {
    this.del.emit(this.value);
  }
}
