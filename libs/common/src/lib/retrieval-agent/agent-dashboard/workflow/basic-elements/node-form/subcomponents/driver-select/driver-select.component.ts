
import { Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule, FormArray, FormControl } from '@angular/forms';
import { OptionModel, PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { SDKService } from '@flaps/core';
import { NucliaDBDriver, ProviderType } from '@nuclia/core';
import { take, switchMap, Observable, map, forkJoin, of } from 'rxjs';
import { InfoCardComponent } from '@nuclia/sistema';
import { RouterLink } from '@angular/router';
import { aragUrl } from '../../../../workflow.state';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-driver-select',
  templateUrl: './driver-select.component.html',
  styleUrls: ['./driver-select.component.scss'],
  standalone: true,
  imports: [
    InfoCardComponent,
    PaButtonModule,
    PaTextFieldModule,
    ReactiveFormsModule,
    FormsModule,
    RouterLink,
    TranslateModule
],
})
export class DriverSelectComponent implements OnInit {
  @Input() label: string = '';
  @Input() required: boolean = false;
  @Input() form?: FormGroup;
  @Input() controlName?: string;
  @Input() provider!: ProviderType | ProviderType[];
  @Input() multiselect: boolean = false;

  private sdk = inject(SDKService);

  driversPath = computed(() => `${aragUrl()}/drivers`);
  options = signal<OptionModel[] | null>(null);
  selectedValues: string[] = []; // Initialize as empty array to prevent undefined issues

  // Computed property to check if there are no valid driver options
  hasNoValidOptions = computed(() => {
    const opts = this.options();
    return opts !== null && !opts.some((o) => !!o.value);
  });

  // Computed property to provide comma-separated string for pa-select
  get selectedValuesAsString(): string {
    return this.selectedValues.join(',');
  }

  ngOnInit(): void {
    // Initialize selectedValues for multiselect before setting options
    if (this.multiselect && this.form && this.controlName) {
      const control = this.form.get(this.controlName);
      if (control instanceof FormArray) {
        // Extract the actual values from FormControls in the FormArray
        this.selectedValues = control.controls.map((ctrl) => ctrl.value).filter((val) => val && val.trim() !== '');
      }
    }

    this.sdk.currentArag
      .pipe(
        take(1),
        switchMap((arag) => {
          // Handle both single provider and array of providers
          const providers = Array.isArray(this.provider) ? this.provider : [this.provider];

          // Get drivers from all providers
          const driverRequests = providers.map(
            (providerType) => arag.getDrivers(providerType) as Observable<NucliaDBDriver[]>,
          );

          // Combine all driver requests
          return forkJoin(driverRequests).pipe(
            map((driverArrays) => {
              // Flatten all driver arrays into a single array
              const allDrivers = driverArrays.flat();

              // Remove duplicates based on identifier
              const uniqueDrivers = allDrivers.filter(
                (driver, index, self) => index === self.findIndex((d) => d.identifier === driver.identifier),
              );

              return uniqueDrivers;
            }),
          );
        }),
        map((drivers) =>
          drivers.map(
            (driver) => new OptionModel({ id: driver.identifier, label: driver.name, value: driver.identifier }),
          ),
        ),
      )
      .subscribe((options) => {
        // For single select, include empty option. For multiselect, don't include it.
        const finalOptions = this.multiselect
          ? options
          : [
              new OptionModel({
                id: '',
                label: '–',
                value: '',
              }),
            ].concat(options);

        this.options.set(finalOptions);
      });
  }

  updateFormArray(selectedValue: string | string[]): void {
    if (!this.form || !this.controlName) return;

    // Handle both string (comma-separated) and array inputs
    let selectedValues: string[];
    if (typeof selectedValue === 'string') {
      selectedValues = selectedValue
        ? selectedValue
            .split(',')
            .map((v) => v.trim())
            .filter((v) => v)
        : [];
    } else {
      selectedValues = selectedValue || [];
    }

    // Update our local selectedValues
    this.selectedValues = selectedValues;

    const control = this.form.get(this.controlName);
    if (control instanceof FormArray) {
      // Clear the array
      while (control.length !== 0) {
        control.removeAt(0);
      }

      // Add selected values (filter out empty values)
      this.selectedValues
        .filter((value) => value && value.trim() !== '')
        .forEach((value) => {
          control.push(new FormControl(value));
        });
    }
  }
}
