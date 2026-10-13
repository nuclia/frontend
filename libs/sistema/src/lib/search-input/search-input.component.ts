import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  Renderer2,
  Self,
  SimpleChanges,
} from '@angular/core';
import { NgControl, ReactiveFormsModule } from '@angular/forms';
import {
  ControlModel,
  NativeTextFieldDirective,
  PaDropdownModule,
  PaFormFieldModule,
  PaPopupModule,
  PaTextFieldModule,
  TextFieldUtilityService,
} from '@guillotinaweb/pastanaga-angular';

import { TranslatePipe } from '@ngx-translate/core';
import { BadgeComponent } from '../badge';

@Component({
  selector: 'nsi-search-input',
  templateUrl: './search-input.component.html',
  styleUrls: ['./search-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    PaFormFieldModule,
    ReactiveFormsModule,
    PaTextFieldModule,
    BadgeComponent,
    PaPopupModule,
    PaDropdownModule,
    TranslatePipe,
  ],
})
export class SisSearchInputComponent
  extends NativeTextFieldDirective
  implements AfterViewInit, OnInit, OnChanges, OnDestroy
{
  override fieldType = 'input';
  private _modes: ControlModel[] = [];
  displayMode = '';
  @Input()
  get modes(): ControlModel[] {
    return this._modes;
  }
  set modes(values: ControlModel[]) {
    this._modes = values;
    if (values.length > 0) {
      this.displayMode = values[0].label;
      this.modeSelected.emit(values[0].value);
    }
  }
  @Output() modeSelected = new EventEmitter<string>();

  constructor(
    override element: ElementRef,
    @Optional() @Self() protected override parentControl: NgControl,
    protected override cdr: ChangeDetectorRef,
    protected override textFieldUtility: TextFieldUtilityService,
    protected override renderer: Renderer2,
  ) {
    super(element, parentControl, cdr, textFieldUtility, renderer);
  }

  override ngAfterViewInit() {
    super.ngAfterViewInit();
  }

  override ngOnInit(): void {
    super.ngOnInit();
  }

  override ngOnChanges(changes: SimpleChanges) {
    super.ngOnChanges(changes);
    this._checkIsFilled();
    this._checkDescribedBy();
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
  }

  onSelect(mode: ControlModel) {
    this.displayMode = mode.label;
    this.modeSelected.emit(mode.value);
  }
}
