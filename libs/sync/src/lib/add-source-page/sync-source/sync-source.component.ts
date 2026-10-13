import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { SDKService } from '@flaps/core';
import { OptionModel, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { InfoCardComponent } from '@nuclia/sistema';
import { map, switchMap, take } from 'rxjs';
import { SyncService } from '../../logic';
import { SourceFormDirective } from '../source-form.directive';

@Component({
  selector: 'nsy-sync-source',
  imports: [CommonModule, InfoCardComponent, PaTextFieldModule, ReactiveFormsModule, TranslatePipe],
  styleUrl: './../_common-source.scss',
  templateUrl: './sync-source.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: SyncSourceComponent, multi: true },
    { provide: NG_VALIDATORS, useExisting: SyncSourceComponent, multi: true },
  ],
})
export class SyncSourceComponent extends SourceFormDirective {
  private syncService = inject(SyncService);
  private sdk = inject(SDKService);

  override form: FormGroup<{ connection: FormControl<string> }> = new FormGroup({
    connection: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  syncs = this.sdk.currentKb.pipe(
    take(1),
    switchMap((kb) => this.syncService.getSyncsForKB(kb.id, true)),
    map((syncs) => syncs.map((sync) => new OptionModel({ id: sync.id, value: sync.id, label: sync.title }))),
  );

  constructor() {
    super();
    this.initForm();
  }
}
