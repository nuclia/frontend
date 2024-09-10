import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'stf-filter-value',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PaTextFieldModule, TranslateModule],
  templateUrl: './filter-value.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterValueComponent implements OnInit, OnDestroy {
  private unsubscribeAll = new Subject<void>();

  @Input({ required: true }) filterType!: string;
  @Input({ required: true }) valueControl!: FormControl;

  @Output() valueChange = new EventEmitter<string>();

  ngOnInit() {
    this.valueControl?.valueChanges
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe((value) => this.valueChange.emit(value));
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
