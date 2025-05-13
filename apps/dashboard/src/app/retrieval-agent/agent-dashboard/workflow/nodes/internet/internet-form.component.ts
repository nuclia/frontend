import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NavigationService, SDKService } from '@flaps/core';
import { OptionModel, PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { InternetProviderType } from '@nuclia/core';
import { InfoCardComponent } from '@nuclia/sistema';
import { forkJoin, map, switchMap, take } from 'rxjs';
import { ConfigurationFormComponent, FormDirective, RulesFieldComponent } from '../../basic-elements';
import { InternetAgentUI, isInternetProvider } from '../../workflow.models';

@Component({
  selector: 'app-internet-form',
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
  ],
  templateUrl: './internet-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InternetFormComponent extends FormDirective implements OnInit {
  private sdk = inject(SDKService);
  private navigationService = inject(NavigationService);

  override form = new FormGroup({
    internet: new FormGroup({
      rules: new FormArray<FormControl<string>>([]),
      provider: new FormControl<InternetProviderType | ''>('', {
        validators: [Validators.required],
        nonNullable: true,
      }),
      brave: new FormGroup({
        domain: new FormControl<string>('', { nonNullable: true }),
        country: new FormControl<string>('', { nonNullable: true }),
      }),
      perplexity: new FormGroup({
        domain: new FormArray<FormControl<string>>([new FormControl<string>('', { nonNullable: true })]),
        top_k: new FormControl<number>(0, { nonNullable: true, validators: [Validators.pattern('^[0-9]*$')] }),
        related_questions: new FormControl<boolean>(false, { nonNullable: true }),
        images: new FormControl<boolean>(false, { nonNullable: true }),
      }),
    }),
  });
  override get configForm() {
    return this.form.controls.internet;
  }

  get provider() {
    return this.configForm.controls.provider.getRawValue();
  }
  get perplexityDomains() {
    return this.configForm.controls.perplexity.controls.domain;
  }

  private aragUrl = signal('');
  driversPath = computed(() => `${this.aragUrl()}/drivers`);
  providerOptions = signal<OptionModel[] | null>(null);

  ngOnInit(): void {
    forkJoin([this.sdk.currentAccount.pipe(take(1)), this.sdk.currentArag.pipe(take(1))])
      .pipe(
        map(([account, arag]) => {
          this.aragUrl.set(this.navigationService.getRetrievalAgentUrl(account.slug, arag.slug));
          return arag;
        }),
        switchMap((arag) => arag.getDrivers()),
        map((drivers) =>
          drivers
            .filter((driver) => isInternetProvider(driver.provider))
            .map(
              (driver) =>
                new OptionModel({ id: driver.id, label: driver.name, value: driver.provider, help: driver.provider }),
            ),
        ),
      )
      .subscribe((options) => this.providerOptions.set(options));
    if (this.config) {
      const config = this.config as InternetAgentUI;
      if (config.perplexity.domain.length > 1) {
        for (let i = 0; i < config.perplexity.domain.length - 1; i++) {
          this.addPerplexityDomain();
        }
        this.perplexityDomains.patchValue(config.perplexity.domain);
      }
    }
  }

  addPerplexityDomain() {
    this.perplexityDomains.push(new FormControl<string>('', { nonNullable: true }));
  }
  removePerplexityDomain(index: number) {
    this.perplexityDomains.removeAt(index);
  }
}
