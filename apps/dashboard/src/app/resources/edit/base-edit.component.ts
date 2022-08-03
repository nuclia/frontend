import { Directive, OnDestroy } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SDKService } from '@flaps/core';
import { Resource } from '@nuclia/core';
import { catchError, combineLatest, delay, filter, share, startWith, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { SisToastService } from '@nuclia/sistema';

@Directive()
export abstract class BaseEditComponent implements OnDestroy {
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
  unsubscribeAll = new Subject<void>();

  constructor(
    protected route: ActivatedRoute,
    protected sdk: SDKService,
    protected formBuilder: UntypedFormBuilder,
    protected toaster: SisToastService,
  ) {
    this.refresh.next(true);
    this.resource.pipe(takeUntil(this.unsubscribeAll)).subscribe();
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  save() {
    const data = this.getValue();
    if (this.currentValue) {
      this.currentValue
        .modify(data)
        .pipe(
          catchError((error) => {
            this.toaster.error(error);
            return error;
          }),
          delay(1000),
        )
        .subscribe(() => {
          this.toaster.success('Resource saved');
          this.refresh.next(true);
        });
    }
  }

  cancel() {
    if (this.currentValue) {
      this.updateForm(this.currentValue);
      this.form.markAsPristine();
    }
  }
  abstract updateForm(data: Resource): void;
  abstract getValue(): Partial<Resource>;
}
