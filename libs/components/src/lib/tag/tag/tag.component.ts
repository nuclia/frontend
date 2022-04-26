import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

export type TagSize = 'normal' | 'large' | 'small';

@Component({
  selector: 'stf-tag',
  templateUrl: './tag.component.html',
  styleUrls: ['./tag.component.scss'],
})
export class TagComponent implements OnInit {
  @Input() tag: string = '';
  @Input() deleteIcon: boolean = false;
  @Input() size: TagSize = 'normal';
  @Input() asToggleButton: boolean = false;
  @Output() clickIcon: EventEmitter<void> = new EventEmitter();
  @Output() selectedChange: EventEmitter<void> = new EventEmitter();

  @Input()
  get secondary(): boolean {
    return this._secondary;
  }
  set secondary(value: boolean) {
    this._secondary = coerceBooleanProperty(value);
  }

  @Input()
  get contrast(): boolean {
    return this._contrast;
  }
  set contrast(value: boolean) {
    this._contrast = coerceBooleanProperty(value);
  }

  @Input()
  get selected(): boolean {
    return this._selected;
  }
  set selected(value: boolean) {
    this._selected = coerceBooleanProperty(value);
  }

  _secondary: boolean = false;
  _contrast: boolean = false;
  _selected: boolean = false;

  constructor() {}

  ngOnInit(): void {}

  onClick() {
    this.selectedChange.emit();
  }

  onClickIcon(): void {
    this.clickIcon.emit();
  }
}
