import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FeaturesService, SDKService, ZoneService } from '@flaps/core';
import {
  ModalRef,
  PaButtonModule,
  PaModalModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { InfoCardComponent } from '@nuclia/sistema';
import { combineLatest, map, take, tap } from 'rxjs';

@Component({
  imports: [
    CommonModule,
    InfoCardComponent,
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
  private sdk = inject(SDKService);
  private features = inject(FeaturesService);

  form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    zone: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    hasMemory: new FormControl<boolean>(false, { nonNullable: true }),
  });
  isAragWithMemoryEnabled = this.features.unstable.aragWithMemory;

  // TODO: At the moment we can't use account.current_memories because it returns a wrong value
  numAragsWithMemory = this.sdk.aragListWithMemory.pipe(map((list) => list.length));
  canAddAragsWithMemory = combineLatest([this.sdk.currentAccount, this.numAragsWithMemory]).pipe(
    map(([account, numAragsWithMemory]) => account.max_memories === -1 || account.max_memories > numAragsWithMemory),
  );

  zones = this.zoneService.getZones().pipe(
    tap((zones) => {
      if (zones && zones.length > 0) {
        this.form.patchValue({ zone: zones[0].slug });
      }
    }),
  );

  constructor(public modal: ModalRef) {
    this.canAddAragsWithMemory.pipe(take(1)).subscribe((canAdd) => {
      if (!canAdd) {
        this.form.controls.hasMemory.disable();
      }
    });
  }

  create() {
    if (this.form.valid) {
      this.modal.close(this.form.getRawValue());
    }
  }
}
