import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnChanges,
  OnDestroy,
  OnInit,
  Optional,
  Renderer2,
  Self,
  SimpleChanges,
} from '@angular/core';
import { FormsModule, NgControl, ReactiveFormsModule } from '@angular/forms';
import {
  NativeTextFieldDirective,
  PaButtonModule,
  PaFormFieldModule,
  TextFieldUtilityService,
} from '@guillotinaweb/pastanaga-angular';

@Component({
  selector: 'nsi-password-input',
  templateUrl: './password-input.component.html',
  styleUrls: ['./password-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ReactiveFormsModule, PaButtonModule, PaFormFieldModule],
})
export class PasswordInputComponent
  extends NativeTextFieldDirective
  implements AfterViewInit, OnInit, OnChanges, OnDestroy
{
  override fieldType = 'input';

  type: 'password' | 'text' = 'password';

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

  toggleInputType() {
    this.type = this.type === 'password' ? 'text' : 'password';
  }
}
