import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, ValidatorFn, Validators } from '@angular/forms';
import { filter, map, switchMap, tap } from 'rxjs';
import { Field, ISyncEntity } from '../../sync/models';
import { SyncService } from '../../sync/sync.service';
import { SisToastService } from '@nuclia/sistema';

@Component({
  selector: 'nsy-edit-settings',
  templateUrl: 'edit-settings.component.html',
  styleUrls: ['edit-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditSyncSettingsComponent implements OnInit {
  @Output() goTo = new EventEmitter<string>();
  form?: UntypedFormGroup;
  fields?: Field[];
  sync?: ISyncEntity;

  constructor(
    private syncService: SyncService,
    private toast: SisToastService,
    private formBuilder: UntypedFormBuilder,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.syncService
      .getCurrentSync()
      .pipe(
        filter((sync) => !!sync),
        tap((sync) => (this.sync = sync)),
        switchMap((sync) =>
          this.syncService.getConnector(sync.connector.name, '').pipe(
            switchMap((connector) => connector.getParameters()),
            map((fields) => ({ sync, fields })),
          ),
        ),
      )
      .subscribe(({ sync, fields }) => this.showFields(sync, fields));
  }

  save() {
    if (this.sync) {
      this.syncService
        .updateSync(this.sync.id, {
          title: this.form?.value['title'] || '',
          connector: {
            ...this.sync.connector,
            parameters: { ...this.sync.connector.parameters, ...(this.form?.value['fields'] || {}) },
          },
        })
        .subscribe({
          next: () => {
            this.toast.success('upload.saved');
            this.goTo.emit('activity');
          },
          error: () => {
            this.toast.error('upload.failed');
          },
        });
    }
  }

  showFields(sync: ISyncEntity, fields: Field[]) {
    this.fields = fields;
    this.form = this.formBuilder.group({
      title: ['', Validators.required],
      fields: this.formBuilder.group(
        fields.reduce((acc, field) => ({ ...acc, [field.id]: ['', this.getFieldValidators(field)] }), {}),
      ),
    });
    this.form.patchValue({
      fields: sync.connector.parameters,
      title: sync.title || sync.id,
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
