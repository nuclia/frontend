import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NavigationService, SDKService } from '@flaps/core';
import { OptionModel, PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { NucliaDBDriver } from '@nuclia/core';
import { ExpandableTextareaComponent, InfoCardComponent } from '@nuclia/sistema';
import { forkJoin, map, Observable, switchMap, take } from 'rxjs';
import { ConfigurationFormComponent, FormDirective, RulesFieldComponent } from '../../basic-elements';

@Component({
  selector: 'app-ask-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    TranslateModule,
    InfoCardComponent,
    PaButtonModule,
    PaTextFieldModule,
    PaTogglesModule,
    ConfigurationFormComponent,
    ExpandableTextareaComponent,
    RulesFieldComponent,
  ],
  templateUrl: './ask-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AskFormComponent extends FormDirective implements OnInit {
  private sdk = inject(SDKService);
  private navigationService = inject(NavigationService);

  override form = new FormGroup({
    ask: new FormGroup({
      sources: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
      rephrase_semantic_custom_prompt: new FormControl<string>('', { nonNullable: true }),
      rephrase_lexical_custom_prompt: new FormControl<string>('', { nonNullable: true }),
      keywords_custom_prompt: new FormControl<string>('', { nonNullable: true }),
      visual_enable_prompt: new FormControl<string>('', { nonNullable: true }),
      full_resource: new FormControl<boolean>(false, { nonNullable: true }),
      vllm: new FormControl<boolean>(true, { nonNullable: true }),
      rules: new FormArray<FormControl<string>>([]),
    }),
  });
  override get configForm() {
    return this.form.controls.ask;
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
        switchMap((arag) => arag.getDrivers('nucliadb') as Observable<NucliaDBDriver[]>),
        map((drivers) =>
          drivers.map((driver) => new OptionModel({ id: driver.id, label: driver.name, value: driver.config.kbid })),
        ),
      )
      .subscribe((options) => this.sourceOptions.set(options));
  }
}
