import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ModalRef,
  PaDropdownModule,
  PaModalModule,
  PaPopupModule,
  PaTextFieldModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { debounceTime, map, of, Subject, switchMap, take } from 'rxjs';
import { SDKService } from '@flaps/core';

@Component({
  imports: [CommonModule, PaDropdownModule, PaModalModule, PaPopupModule, PaTextFieldModule, TranslateModule],
  templateUrl: './find-resource-modal.component.html',
  styleUrl: './find-resource-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FindResourceModalComponent {
  sdk = inject(SDKService);

  search = new Subject<string>();
  minLength = 2;
  query: string = '';
  resources = this.search.pipe(
    debounceTime(300),
    switchMap((value) =>
      this.sdk.currentKb.pipe(
        take(1),
        switchMap((kb) =>
          value.length > this.minLength
            ? kb.catalog(value).pipe(map((res) => (res.type === 'error' ? [] : Object.values(res.resources || {}))))
            : of([]),
        ),
      ),
    ),
  );
  constructor(public modal: ModalRef) {}
}
