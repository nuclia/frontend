import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { ConnectorDefinition, IConnector, SyncService } from '../logic';
import { filter, map, Observable, switchMap, take } from 'rxjs';
import { PaButtonModule, PaDatePickerModule, PaIconModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import {
  BackButtonComponent,
  InfoCardComponent,
  LabelsExpanderComponent,
  SisModalService,
  StickyFooterComponent,
  TwoColumnsConfigurationItemComponent,
} from '@nuclia/sistema';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LabelModule, LabelSetFormModalComponent, LabelsService, ParametersTableComponent } from '@flaps/core';
import { LabelSet, LabelSets } from '@nuclia/core';

@Component({
  selector: 'nsy-add-sync-page',
  standalone: true,
  imports: [
    CommonModule,
    BackButtonComponent,
    InfoCardComponent,
    PaButtonModule,
    PaIconModule,
    PaTextFieldModule,
    ReactiveFormsModule,
    StickyFooterComponent,
    TranslateModule,
    TwoColumnsConfigurationItemComponent,
    PaDatePickerModule,
    ParametersTableComponent,
    LabelsExpanderComponent,
    LabelModule,
  ],
  templateUrl: './add-sync-page.component.html',
  styleUrl: './add-sync-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddSyncPageComponent implements OnInit {
  private currentRoute = inject(ActivatedRoute);
  private syncService = inject(SyncService);
  private labelService = inject(LabelsService);
  private modalService = inject(SisModalService);

  connectorId = this.currentRoute.params.pipe(
    filter((params) => params['connector']),
    map((params) => params['connector'] as string),
  );
  connectorDefinition: Observable<ConnectorDefinition> = this.connectorId.pipe(
    map((id) => this.syncService.getConnectorDefinition(id)),
  );
  connector: Observable<IConnector> = this.connectorId.pipe(switchMap((id) => this.syncService.getConnector(id, '')));

  form = new FormGroup({
    name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    filterResources: new FormGroup({
      extensions: new FormControl<string>(''),
      extensionUsage: new FormControl<'include' | 'exclude'>('include', { nonNullable: true }),
      from: new FormControl(''),
      to: new FormControl(''),
    }),
    extra: new FormGroup({}),
  });

  labelSets: Observable<LabelSets | null> = this.labelService.resourceLabelSets;
  hasLabelSet: Observable<boolean> = this.labelService.hasResourceLabelSets;
  selectedLabelSet?: { id: string; labelSet: LabelSet };

  tables: { [tableId: string]: { key: string; value: string; secret: boolean }[] } = {};

  ngOnInit() {
    this.connector
      .pipe(
        take(1),
        switchMap((connector) => connector.getParametersSections()),
      )
      .subscribe((sections) => {
        sections.forEach((section) =>
          section.fields.forEach((field) => {
            if (field.type !== 'table') {
              this.form.controls.extra.addControl(
                field.id,
                new FormControl<string>('', {
                  nonNullable: true,
                  validators: field.required ? [Validators.required] : [],
                }),
              );
            }
          }),
        );
      });
  }

  updateTable(fieldId: string, values: { key: string; value: string; secret: boolean }[]) {
    this.tables[fieldId] = values;
  }

  createLabelSet() {
    this.modalService.openModal(LabelSetFormModalComponent);
  }
}
