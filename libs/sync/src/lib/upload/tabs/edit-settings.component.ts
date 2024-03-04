import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, ValidatorFn, Validators } from '@angular/forms';
import { filter, map, switchMap, take, tap } from 'rxjs';
import { Field, Source } from '../../sync/new-models';
import { SyncService } from '../../sync/sync.service';
import { SisToastService } from '@nuclia/sistema';

@Component({
  selector: 'nsy-edit-settings',
  templateUrl: 'edit-settings.component.html',
  styleUrls: ['edit-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditSyncSettingsComponent implements OnInit {
  @Output() done = new EventEmitter();
  form?: UntypedFormGroup;
  fields?: Field[];
  source?: Source;

  constructor(
    private syncService: SyncService,
    private toast: SisToastService,
    private formBuilder: UntypedFormBuilder,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.syncService.currentSource
      .pipe(
        filter((source) => !!source),
        tap((source) => (this.source = source)),
        switchMap((source) =>
          this.syncService.getSource(source.connectorId, '').pipe(
            switchMap((connector) => connector.getParameters()),
            map((fields) => ({ source, fields })),
          ),
        ),
        switchMap(({ source, fields }) => this.syncService.currentSourceId.pipe(map((id) => ({ id, source, fields })))),
      )
      .subscribe(({ id, source, fields }) => this.showFields(id, source, fields));
  }

  save() {
    if (this.source) {
      this.syncService.currentSourceId
        .pipe(
          filter((id) => !!id),
          take(1),
          switchMap((id) =>
            this.syncService.setSourceData(id || '', {
              ...this.source,
              title: this.form?.value['title'] || '',
              connectorId: this.source?.connectorId || '',
              data: { ...this.source?.data, ...(this.form?.value['fields'] || {}) },
            }),
          ),
        )
        .subscribe({
          next: () => {
            this.toast.success('upload.saved');
            this.done.emit();
          },
          error: () => {
            this.toast.error('upload.failed');
          },
        });
    }
  }

  showFields(id: string | null, source: Source, fields: Field[]) {
    this.fields = fields;
    this.form = this.formBuilder.group({
      title: ['', Validators.required],
      fields: this.formBuilder.group(
        fields.reduce((acc, field) => ({ ...acc, [field.id]: ['', this.getFieldValidators(field)] }), {}),
      ),
    });
    this.form.patchValue({
      fields: source.data,
      title: source.title || id || '',
    });
    this.cdr.markForCheck();
  }

  getFieldValidators(field: Field) {
    const validators: ValidatorFn[] = [];
    if (field.required) {
      validators.push(Validators.required);
    }
    if (field.pattern) {
      validators.push(Validators.pattern(field.pattern));
    }
    return validators;
  }
}
