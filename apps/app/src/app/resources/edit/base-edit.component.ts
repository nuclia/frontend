import { ChangeDetectorRef, Directive, OnDestroy } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SDKService } from '@flaps/auth';
import { Resource } from '@nuclia/core';
import { combineLatest, switchMap, filter, tap, Subject, startWith, share, takeUntil } from 'rxjs';
import { AppToasterService } from '../../services/app-toaster.service';

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
    protected toaster: AppToasterService,
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
