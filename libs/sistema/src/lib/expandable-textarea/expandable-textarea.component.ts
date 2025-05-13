import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Optional,
  Renderer2,
  Self,
  SimpleChanges,
} from '@angular/core';
import { NgControl, ReactiveFormsModule } from '@angular/forms';
import {
  ModalConfig,
  PaButtonModule,
  PaFormFieldModule,
  PaTextFieldModule,
  TextareaComponent,
  TextFieldUtilityService,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { takeUntil } from 'rxjs';
import { SisModalService } from '../sis-modal.service';
import { TextareaModalComponent } from './textarea-modal/textarea-modal.component';

@Component({
  selector: 'nsi-expandable-textarea',
  templateUrl: './expandable-textarea.component.html',
  styleUrls: ['./expandable-textarea.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, PaButtonModule, PaFormFieldModule, PaTextFieldModule, ReactiveFormsModule, TranslateModule],
})
export class ExpandableTextareaComponent
  extends TextareaComponent
  implements AfterViewInit, OnInit, OnChanges, OnDestroy
{
  @Input({ required: true }) modalTitle = '';

  constructor(
    protected override element: ElementRef,
    @Optional() @Self() protected override parentControl: NgControl,
    protected override cdr: ChangeDetectorRef,
    protected override textFieldUtility: TextFieldUtilityService,
    protected override renderer: Renderer2,
    private modalService: SisModalService,
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
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
  }

  expand() {
    this.modalService
      .openModal(
        TextareaModalComponent,
        new ModalConfig<{ value: string; title: string; help?: string; placeholder?: string }>({
          data: { value: this.control.value, title: this.modalTitle, help: this.help, placeholder: this.placeholder },
        }),
      )
      .onClose.pipe(takeUntil(this.terminator$))
      .subscribe((value) => {
        if (typeof value === 'string') {
          this.control.patchValue(value);
        }
      });
  }
}
