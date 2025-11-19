import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FeaturesService, ZoneService } from '@flaps/core';
import {
  ModalRef,
  PaButtonModule,
  PaModalModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { tap } from 'rxjs';

@Component({
  imports: [
    CommonModule,
    PaModalModule,
    PaButtonModule,
    PaTextFieldModule,
    PaTogglesModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
  templateUrl: './create-arag.component.html',
  styleUrl: './create-arag.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateAragComponent {
  private zoneService: ZoneService = inject(ZoneService);
  private features = inject(FeaturesService);

  form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    zone: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    hasMemory: new FormControl<boolean>(false, { nonNullable: true }),
  });
  isAragWithMemoryEnabled = this.features.unstable.aragWithMemory;

  zones = this.zoneService.getZones().pipe(
    tap((zones) => {
      if (zones && zones.length > 0) {
        this.form.patchValue({ zone: zones[0].slug });
      }
    }),
  );

  constructor(public modal: ModalRef) {}

  create() {
    if (this.form.valid) {
      this.modal.close(this.form.getRawValue());
    }
  }
}
