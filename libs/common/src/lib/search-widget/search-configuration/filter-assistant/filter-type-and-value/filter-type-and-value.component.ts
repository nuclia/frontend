import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { InfoCardComponent } from '@nuclia/sistema';
import { TranslateModule } from '@ngx-translate/core';
import { PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SimpleFilter } from '../filter-assistant.models';

@Component({
  selector: 'stf-filter-type-and-value',
  standalone: true,
  imports: [CommonModule, FormsModule, InfoCardComponent, ReactiveFormsModule, TranslateModule, PaTextFieldModule],
  templateUrl: './filter-type-and-value.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class FilterTypeAndValueComponent implements OnInit, OnDestroy {
  private unsubscribeAll = new Subject<void>();

  @Output() filterChange = new EventEmitter<SimpleFilter>();

  simpleForm = new FormGroup({
    type: new FormControl<string>('', { validators: [Validators.required], nonNullable: true }),
    value: new FormControl<string>('', { validators: [Validators.required], nonNullable: true }),
  });

  get simpleTypeValue() {
    return this.simpleForm.controls.type.value;
  }
  get simpleValueControl() {
    return this.simpleForm.controls.value;
  }

  ngOnInit(): void {
    this.simpleForm.valueChanges
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(() => this.filterChange.emit(this.simpleForm.getRawValue()));
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  resetSimpleValue() {
    this.simpleValueControl.patchValue('');
  }
}
