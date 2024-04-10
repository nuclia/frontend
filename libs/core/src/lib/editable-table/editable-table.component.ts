import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { PaButtonModule, PaTableModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, combineLatest, distinctUntilChanged, skip, startWith, takeUntil } from 'rxjs';

@Component({
  selector: 'app-editable-table',
  templateUrl: 'editable-table.component.html',
  styleUrls: ['editable-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    PaTableModule,
    PaTextFieldModule,
    PaButtonModule,
    PaTogglesModule,
    ReactiveFormsModule,
  ],
})
export class EditableTableComponent implements OnInit, OnDestroy {
  form = new FormGroup({
    rows: new FormArray([this.createRow()]),
  });
  length = 0;

  @Input()
  set values(values: { key: string; value: string; secret: boolean }[]) {
    if (values.length !== this.length) {
      this.length = values.length;
      this.setForm(values);
    }
  }

  @Output() valuesChanges = new EventEmitter<{ key: string; value: string; secret: boolean }[]>();

  get rows() {
    return this.form.controls.rows.controls;
  }
  private unsubscribe = new Subject<void>();

  ngOnInit() {
    this.watchValues();
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  addRow() {
    this.length++;
    this.setForm([...(this.form.value.rows || []), {}]);
  }

  setForm(values: { key?: string; value?: string; secret?: boolean }[] = []) {
    this.form = new FormGroup({
      rows: new FormArray(Array.from({ length: this.length }, () => this.createRow())),
    });
    this.form.patchValue({ rows: this.normalize(values) });
    this.unsubscribe.next();
    this.watchValues();
  }

  private watchValues() {
    const current = this.form.value.rows || [];
    combineLatest(this.rows.map((r, i) => r.valueChanges.pipe(startWith(current[i] || {}), distinctUntilChanged())))
      .pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
      .subscribe((data) => this.valuesChanges.emit(this.normalize(data)));
  }

  private normalize(rows?: Partial<{ key?: string; value?: string; secret?: boolean }[]>) {
    return (rows || []).map((row) => ({
      key: row?.key || '',
      value: row?.value || '',
      secret: row?.secret || false,
    }));
  }

  private createRow() {
    return new FormGroup({
      key: new FormControl<string>('', { nonNullable: true }),
      value: new FormControl<string>('', { nonNullable: true }),
      secret: new FormControl<boolean>(false, { nonNullable: true }),
    });
  }
}
