import { NG_VALIDATORS, NG_VALUE_ACCESSOR, Validator } from '@angular/forms';
import {
  EventEmitter,
  Input,
  OnInit,
  Output,
  Directive,
  Component,
  forwardRef,
  ViewEncapsulation,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { coerceBooleanProperty } from '@angular/cdk/coercion';

@Component({
  selector: 'stf-richtext',
  templateUrl: 'richtext.component.html',
  styleUrls: ['richtext.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class RichTextComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() editable: EventEmitter<boolean> | undefined;
  @Input() id: string | undefined;
  @Input() name: string | undefined;
  @Input() value: string = '';
  @Input() errorHelp: string | undefined;
  @Input() errorMessage: string | undefined;
  @Input() placeholder: string = '';
  @Input() help: string | undefined;
  @Input() behavior: string | undefined;
  @Input() field: string | undefined;
  @Input() saveButton: boolean = true;
  get required(): boolean {
    return this._required;
  }
  set required(value: boolean) {
    this._required = coerceBooleanProperty(value);
  }
  protected _required = false;
  @Input() min: number | undefined;
  @Input() max: number | undefined;

  @Input() large: boolean = false;
  @Input() bold: boolean = false;

  @Input() isReadOnly: boolean | undefined;
  @Input() isLabelHidden: boolean | undefined;

  @Output() valueChange: EventEmitter<any> = new EventEmitter();
  @Output() change: EventEmitter<any> = new EventEmitter();

  helpId: string | undefined;

  content: string | undefined;

  @Input() public show_editable: boolean = false;

  hasError = false;
  errors: { required: boolean; passwordStrength?: boolean; min?: boolean; max?: boolean } = {
    required: false,
  };

  pending: boolean = false;
  originvalue: string | number | undefined;

  debouncer: Subject<string> = new Subject();
  private unsubscribeAll: Subject<void>;

  constructor() {
    this.debouncer.pipe(debounceTime(500)).subscribe((value) => this.valueChange.emit(value));
    this.unsubscribeAll = new Subject();
  }

  ngOnInit() {
    // For comparision
    this.originvalue = this.value;
    // For income ngmodel
    this.content = this.value;
  }

  ngAfterViewInit(): void {
    // For comparision
    this.originvalue = this.value;
    // For income ngmodel
    this.content = this.value;
    this.editable?.pipe(takeUntil(this.unsubscribeAll)).subscribe((value) => {
      this.show_editable = value;
      this.content = this.value;
      this.originvalue = this.value;
    });
  }

  ngOnDestroy(): void {
    if (this.unsubscribeAll) {
      this.unsubscribeAll.next();
      this.unsubscribeAll.complete();
    }
  }

  onContentChanged(value: any) {
    this.value = value.html;
    if (this.value !== this.originvalue && this.saveButton) {
      this.pending = true;
    } else {
      this.pending = false;
    }
    this.debouncer.next(this.value);
  }

  onBlur() {}

  save() {
    this.change.emit({
      bhr: this.behavior,
      field: this.field,
      op: 'set',
      value: this.value,
    });
    this.pending = false;
    this.originvalue = this.value;
  }
}
