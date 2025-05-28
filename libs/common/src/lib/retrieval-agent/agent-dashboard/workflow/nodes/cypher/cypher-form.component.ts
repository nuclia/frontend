import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SDKService } from '@flaps/core';
import { OptionModel, PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { InfoCardComponent } from '@nuclia/sistema';
import { map, switchMap, take } from 'rxjs';
import { ConfigurationFormComponent, FormDirective } from '../../basic-elements';
import { CypherAgentUI } from '../../workflow.models';
import { aragUrl } from '../../workflow.state';

@Component({
  selector: 'app-cypher-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    PaButtonModule,
    PaTextFieldModule,
    PaTogglesModule,
    InfoCardComponent,
    ConfigurationFormComponent,
    RouterLink,
  ],
  templateUrl: './cypher-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CypherFormComponent extends FormDirective implements OnInit {
  private sdk = inject(SDKService);

  override form = new FormGroup({
    cypher: new FormGroup({
      source: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
      exclude_types: new FormArray<FormControl<string>>([new FormControl<string>('', { nonNullable: true })]),
      include_types: new FormArray<FormControl<string>>([new FormControl<string>('', { nonNullable: true })]),
      allow_dangerous_requests: new FormControl<boolean>(true, { nonNullable: true }),
      top_k: new FormControl<number>(10, { nonNullable: true }),
    }),
  });
  override get configForm() {
    return this.form.controls.cypher;
  }

  get excludeTypes() {
    return this.configForm.controls.exclude_types;
  }
  get includeTypes() {
    return this.configForm.controls.include_types;
  }

  sourceOptions = signal<OptionModel[] | null>(null);
  driversPath = computed(() => `${aragUrl()}/drivers`);

  ngOnInit(): void {
    this.sdk.currentArag
      .pipe(
        take(1),
        switchMap((arag) => arag.getDrivers('cypher')),
        map((drivers) =>
          drivers.map(
            (driver) => new OptionModel({ id: driver.identifier, label: driver.name, value: driver.identifier }),
          ),
        ),
      )
      .subscribe((options) => this.sourceOptions.set(options));

    if (this.config) {
      const config = this.config as CypherAgentUI;
      if (config.exclude_types.length > 1) {
        for (let i = 0; i < config.exclude_types.length - 1; i++) {
          this.addExcludeType();
        }
        this.excludeTypes.patchValue(config.exclude_types);
      }
      if (config.include_types.length > 1) {
        for (let i = 0; i < config.include_types.length - 1; i++) {
          this.addIncludeType();
        }
        this.includeTypes.patchValue(config.include_types);
      }
    }
  }

  addIncludeType() {
    this.includeTypes.push(new FormControl<string>('', { nonNullable: true }));
  }
  removeIncludeType(index: number) {
    this.includeTypes.removeAt(index);
  }

  addExcludeType() {
    this.excludeTypes.push(new FormControl<string>('', { nonNullable: true }));
  }
  removeExcludeType(index: number) {
    this.excludeTypes.removeAt(index);
  }
}
