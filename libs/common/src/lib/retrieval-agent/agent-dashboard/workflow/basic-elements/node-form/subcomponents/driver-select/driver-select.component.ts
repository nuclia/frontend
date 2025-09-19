import { CommonModule } from '@angular/common';
import { Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { OptionModel, PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { SDKService } from '@flaps/core';
import { NucliaDBDriver, ProviderType } from '@nuclia/core';
import { take, switchMap, Observable, map } from 'rxjs';
import { InfoCardComponent } from '@nuclia/sistema';
import { RouterLink } from '@angular/router';
import { aragUrl } from '../../../../workflow.state';

@Component({
  selector: 'app-driver-select',
  templateUrl: './driver-select.component.html',
  styleUrls: ['./driver-select.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    InfoCardComponent,
    PaButtonModule,
    PaTextFieldModule,
    ReactiveFormsModule,
    RouterLink,
    TranslateModule,
  ],
})
export class DriverSelectComponent implements OnInit {
  @Input() label: string = '';
  @Input() required: boolean = false;
  @Input() form?: FormGroup;
  @Input() controlName?: string;
  @Input() provider!: ProviderType;

  private sdk = inject(SDKService);

  driversPath = computed(() => `${aragUrl()}/drivers`);
  options = signal<OptionModel[] | null>(null);

  ngOnInit(): void {
    this.sdk.currentArag
      .pipe(
        take(1),
        switchMap((arag) => arag.getDrivers(this.provider) as Observable<NucliaDBDriver[]>),
        map((drivers) =>
          drivers.map(
            (driver) => new OptionModel({ id: driver.identifier, label: driver.name, value: driver.identifier }),
          ),
        ),
      )
      .subscribe((options) =>
        this.options.set(
          [
            new OptionModel({
              id: '',
              label: '–',
              value: '',
            }),
          ].concat(options),
        ),
      );
  }
}
