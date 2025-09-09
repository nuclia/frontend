import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewEncapsulation,
} from '@angular/core';

import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { filterTypeList, SimpleFilter } from '../filter-assistant.models';
import { FilterValueComponent } from './filter-value.component';

@Component({
  selector: 'stf-filter-type-and-value',
  imports: [FormsModule, ReactiveFormsModule, TranslateModule, PaTextFieldModule, FilterValueComponent],
  templateUrl: './filter-type-and-value.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class FilterTypeAndValueComponent implements OnInit, OnDestroy {
  private translate = inject(TranslateService);
  private unsubscribeAll = new Subject<void>();

  protected readonly filterTypeList = filterTypeList.map((option) => ({
    ...option,
    label: this.translate.instant(option.label),
  }));

  @Input() set filter(filter: SimpleFilter | undefined) {
    if (filter) {
      this.simpleForm.patchValue(filter);
    }
  }

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
