import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { SyncService } from '../sync/sync.service';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Subject, filter, forkJoin, map, switchMap, take, takeUntil, tap } from 'rxjs';
import { SisToastService } from '@nuclia/sistema';
import { UntypedFormBuilder, UntypedFormGroup, ValidatorFn, Validators } from '@angular/forms';
import { Field, ISourceConnector, Source } from '../sync/new-models';
import { IErrorMessages } from '@guillotinaweb/pastanaga-angular';
import { SDKService } from '@flaps/core';

@Component({
  templateUrl: 'add-sync.component.html',
  styleUrls: ['add-sync.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddSyncComponent implements OnInit {
  form?: UntypedFormGroup;
  fields?: Field[];
  validationMessages: { [key: string]: IErrorMessages } = {
    id: {
      pattern: 'Use only letters, numbers, dashes and underscores',
    } as IErrorMessages,
  };
  connectorId = location.pathname.split('/upload/sync/add/')[1] || '';
  connector = this.syncService.sourceObs.pipe(map((sources) => sources.find((s) => s.id === this.connectorId)));

  constructor(
    private syncService: SyncService,
    private toast: SisToastService,
    private formBuilder: UntypedFormBuilder,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.syncService
      .getSource(this.connectorId, '')
      .pipe(
        take(1),
        switchMap((connector) => connector.getParameters()),
      )
      .subscribe((fields) => this.showFields(fields));
  }

  save() {
    const id = this.form?.value['id'];
    if (id) {
      this.syncService
        .setSourceAndDestination(
          id,
          {
            connectorId: this.connectorId || '',
            data: this.form?.value['fields'],
          },
          '',
        )
        .pipe(
          tap(() => this.syncService.setCurrentSourceId(id)),
          switchMap(() => this.syncService.getSource(this.connectorId, id).pipe(take(1))),
          tap((source) => {
            if (!source.hasServerSideAuth) {
              this.router.navigate([`../../${id}`], { relativeTo: this.route });
            } else {
              const basePath = location.href.split('/upload/sync/add/')[0];
              source.goToOAuth(`${basePath}/upload/sync/${id}`, true);
            }
          }),
        )
        .subscribe({
          next: () => {
            this.toast.success('upload.saved');
          },
          error: () => {
            this.toast.error('upload.failed');
          },
        });
    }
  }

  showFields(fields: Field[]) {
    this.fields = fields;
    this.form = this.formBuilder.group({
      id: ['', [Validators.required, Validators.pattern('[a-zA-Z-0-9-_]+')]],
      fields: this.formBuilder.group(
        fields.reduce((acc, field) => ({ ...acc, [field.id]: ['', this.getFieldValidators(field)] }), {}),
      ),
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