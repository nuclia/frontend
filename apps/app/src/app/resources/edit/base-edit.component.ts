import { Directive } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SDKService } from '@flaps/auth';
import { Resource } from '@nuclia/core';
import { combineLatest, switchMap, filter, tap, take, Subject, startWith, share } from 'rxjs';
import { AppToasterService } from '../../services/app-toaster.service';

@Directive()
export abstract class BaseEditComponent {
  refresh = new Subject<boolean>();
  resource = combineLatest([
    this.sdk.currentKb,
    this.route.parent!.params.pipe(filter((params) => !!params.id)),
    this.refresh.pipe(startWith(true)),
  ]).pipe(
    switchMap(([kb, params]) => kb.getResource(params.id)),
    tap((resource) => {
      this.currentValue = resource;
      this.updateForm(resource);
    }),
    share(),
  );
  form = this.formBuilder.group({});
  currentValue?: Resource;

  constructor(
    protected route: ActivatedRoute,
    protected sdk: SDKService,
    protected formBuilder: FormBuilder,
    protected toaster: AppToasterService,
  ) {
    this.refresh.next(true);
  }

  save() {
    const data = this.getValue();
    if (this.currentValue) {
      this.currentValue.modify(data).subscribe({
        next: () => {
          this.toaster.success('Resource saved');
          this.refresh.next(true);
        },
        error: (error) => {
          this.toaster.error(error);
        },
      });
    }
  }

  cancel() {
    if (this.currentValue) {
      this.updateForm(this.currentValue);
    }
  }
  abstract updateForm(data: Resource): void;
  abstract getValue(): Partial<Resource>;
}
