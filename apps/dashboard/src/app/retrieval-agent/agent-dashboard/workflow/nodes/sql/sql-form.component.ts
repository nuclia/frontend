import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NavigationService, SDKService } from '@flaps/core';
import { OptionModel, PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ExpandableTextareaComponent, InfoCardComponent } from '@nuclia/sistema';
import { forkJoin, map, switchMap, take } from 'rxjs';
import { ConfigurationFormComponent, FormDirective, RulesFieldComponent } from '../../basic-elements';
import { formatExtraConfig, SqlAgentUI } from '../../workflow.models';

let propertyIndex = 0;

@Component({
  selector: 'app-sql-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    PaButtonModule,
    PaTextFieldModule,
    PaTogglesModule,
    ConfigurationFormComponent,
    RulesFieldComponent,
    InfoCardComponent,
    RouterLink,
    ExpandableTextareaComponent,
  ],
  templateUrl: './sql-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SqlFormComponent extends FormDirective implements OnInit {
  private sdk = inject(SDKService);
  private navigationService = inject(NavigationService);

  override form = new FormGroup({
    sql: new FormGroup({
      source: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      prompt: new FormControl('', { nonNullable: true }),
      retries: new FormControl(3, { nonNullable: true, validators: [Validators.pattern('^[0-9]*$')] }),
      rules: new FormArray<FormControl<string>>([]),
      sqlschema: new FormControl<string | null>(null),
      ignore_tables: new FormControl<string | null>(null),
      include_tables: new FormControl<string | null>(null),
      sample_rows_in_table_info: new FormControl(3, {
        nonNullable: true,
        validators: [Validators.pattern('^[0-9]*$')],
      }),
      indexes_in_table_info: new FormControl(false, { nonNullable: true }),
      custom_table_info: new FormGroup({}),
      view_support: new FormControl(false, { nonNullable: true }),
      max_string_length: new FormControl(300, { nonNullable: true, validators: [Validators.pattern('^[0-9]*$')] }),
      lazy_table_reflection: new FormControl(false, { nonNullable: true }),
    }),
  });
  override get configForm() {
    return this.form.controls.sql;
  }

  get includeTableControl() {
    return this.configForm.controls.include_tables;
  }
  get ignoreTableControl() {
    return this.configForm.controls.ignore_tables;
  }
  get customTableControl() {
    return this.configForm.controls.custom_table_info;
  }

  private aragUrl = signal('');
  driversPath = computed(() => `${this.aragUrl()}/drivers`);
  sourceOptions = signal<OptionModel[] | null>(null);

  ngOnInit() {
    forkJoin([this.sdk.currentAccount.pipe(take(1)), this.sdk.currentArag.pipe(take(1))])
      .pipe(
        map(([account, arag]) => {
          this.aragUrl.set(this.navigationService.getRetrievalAgentUrl(account.slug, arag.slug));
          return arag;
        }),
        switchMap((arag) => arag.getDrivers('sql')),
        map((drivers) =>
          drivers.map((driver) => new OptionModel({ id: driver.id, label: driver.name, value: driver.id })),
        ),
      )
      .subscribe((options) => this.sourceOptions.set(options));

    if (this.config) {
      const config = this.config as SqlAgentUI;
      if (config.custom_table_info) {
        const extraConfig = Object.entries(config.custom_table_info);
        if (extraConfig.length > 0) {
          extraConfig.forEach(([property, value]) => {
            this.addConfigProperty(property, `${value}`);
          });
        }
      }
    }
  }

  manageTableExclusionState(fieldChanged: 'include_tables' | 'ignore_tables') {
    const control = fieldChanged === 'include_tables' ? this.ignoreTableControl : this.includeTableControl;
    if (this.configForm.controls[fieldChanged].value) {
      control.disable();
    } else {
      control.enable();
    }
  }

  override submit() {
    if (this.form.valid) {
      const { ignore_tables, include_tables, custom_table_info, ...rawConfig } = this.configForm.getRawValue();
      const config: SqlAgentUI = {
        ...rawConfig,
        ignore_tables: ignore_tables ? ignore_tables.split(',').map((item) => item.trim()) : [],
        include_tables: include_tables ? include_tables.split(',').map((item) => item.trim()) : [],
        custom_table_info: formatExtraConfig(custom_table_info),
      };
      this.submitForm.emit(config);
    }
  }

  addConfigProperty(property?: string, value?: string) {
    this.customTableControl.addControl(
      `property_${propertyIndex}`,
      new FormGroup({
        property: new FormControl<string>(property || '', {
          nonNullable: true,
          validators: [Validators.required],
        }),
        value: new FormControl<string>(value || '', { nonNullable: true }),
      }),
    );
    propertyIndex++;
  }

  removeProperty(key: string) {
    this.customTableControl.removeControl(key);
  }
}
