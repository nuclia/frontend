import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { SyncService } from '../sync/sync.service';
import { ActivatedRoute, Router } from '@angular/router';
import { map, of, switchMap, take, tap } from 'rxjs';
import { SisToastService } from '@nuclia/sistema';
import { UntypedFormBuilder, UntypedFormGroup, ValidatorFn, Validators } from '@angular/forms';
import { Field } from '../sync/models';
import { SDKService } from '@flaps/core';

const SLUGIFY = new RegExp(/[^a-z0-9_-]/g);

@Component({
  templateUrl: 'add-sync.component.html',
  styleUrls: ['add-sync.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddSyncComponent implements OnInit {
  form?: UntypedFormGroup;
  fields?: Field[];
  connectorId =
    (this.sdk.nuclia.options.standalone ? location.hash : location.pathname).split('/upload/sync/add/')[1] || '';
  connector = this.syncService.connectorsObs.pipe(map((sources) => sources.find((s) => s.id === this.connectorId)));
  canSyncSecurityGroups = false;
  tables: { [tableId: string]: { key: string; value: string; secret: boolean }[] } = {};

  constructor(
    private syncService: SyncService,
    private toast: SisToastService,
    private formBuilder: UntypedFormBuilder,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute,
    private sdk: SDKService,
  ) {}

  ngOnInit(): void {
    this.syncService
      .getConnector(this.connectorId, '')
      .pipe(
        take(1),
        switchMap((connector) => {
          this.canSyncSecurityGroups = connector.canSyncSecurityGroups;
          return connector.getParameters();
        }),
      )
      .subscribe((fields) => this.showFields(fields));
  }

  save() {
    const title = this.form?.value['title'];
    const data = this.form?.value['fields'];
    let id = title?.toLowerCase().replace(SLUGIFY, '-');
    this.sdk.currentKb
      .pipe(
        take(1),
        switchMap((kb) => {
          id = `${kb.id}-${id}`;
          return this.syncService.addSync({
            id,
            connector: { name: this.connectorId || '', parameters: { ...data, ...this.tables } },
            title,
            syncSecurityGroups: this.form?.value['syncSecurityGroups'],
          });
        }),
        tap(() => this.syncService.setCurrentSourceId(id)),
        switchMap(() => this.syncService.getConnector(this.connectorId, id).pipe(take(1))),
        switchMap((sourceConnector) => {
          // Setup sync items from the source itself if the source doesn't allow to select folders
          if (!sourceConnector.allowToSelectFolders) {
            if (typeof sourceConnector.handleParameters === 'function') {
              sourceConnector.handleParameters(data);
            }
            return this.syncService
              .updateSync(id, {
                foldersToSync: sourceConnector.getStaticFolders(),
              })
              .pipe(switchMap(() => this.syncService.getConnector(this.connectorId, id).pipe(take(1))));
          } else {
            return of(sourceConnector);
          }
        }),
        tap((source) => {
          if (!source.hasServerSideAuth) {
            this.router.navigate([`../../${id}`], { relativeTo: this.route });
          } else {
            let basePath = location.href.split('/upload/sync/add/')[0];
            if (this.sdk.nuclia.options.standalone) {
              // NucliaDB admin uses hash routing but the oauth flow does not support it
              // so we remove '#/' from the path and we will restore it in app.component after
              // the oauth flow is completed
              basePath = basePath.replace('#/', '');
            }
            source.goToOAuth(`${basePath}/upload/sync/${id}`, true);
          }
        }),
      )
      .subscribe({
        next: () => {
          this.toast.success('upload.saved');
        },
        error: (error) => {
          console.warn(error);
          this.toast.error('upload.failed');
        },
      });
  }

  showFields(fields: Field[]) {
    this.fields = fields;
    this.form = this.formBuilder.group({
      title: ['', [Validators.required]],
      syncSecurityGroups: [false],
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

  updateTable(fieldId: string, values: { key: string; value: string; secret: boolean }[]) {
    this.tables[fieldId] = values;
  }
}
