import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZoneService } from '@flaps/core';
import { PaButtonModule, PaIconModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { StickyFooterComponent } from '@nuclia/sistema';
import { tap } from 'rxjs';

@Component({
  selector: 'nus-zone-step',
  imports: [
    CommonModule,
    PaButtonModule,
    PaIconModule,
    PaTogglesModule,
    ReactiveFormsModule,
    StickyFooterComponent,
    TranslateModule,
  ],
  templateUrl: './zone-step.component.html',
  styleUrls: ['../../_common-step.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoneStepComponent {
  private zoneService = inject(ZoneService);

  @Input() set data(value: string) {
    this.form.patchValue({ region: value });
  }

  @Output() back = new EventEmitter<void>();
  @Output() next = new EventEmitter<string>();

  zones = this.zoneService.getZones().pipe(
    tap((zones) => {
      if (zones.length === 1) {
        this.form.controls.region.patchValue(zones[0].slug);
      }
    }),
  );

  form = new FormGroup({
    region: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
  });

  goBack() {
    this.back.emit();
  }

  submitForm() {
    this.next.emit(this.form.getRawValue().region);
  }
}
