import { Pipe, PipeTransform, OnDestroy, ChangeDetectorRef } from '@angular/core';

import { DeprecatedApiService } from '../api';
import { Subscription } from 'rxjs';
import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';

import { DomSanitizer } from '@angular/platform-browser';

// Using similarity from AsyncPipe to avoid having to pipe |secure|async in HTML.
@Pipe({
  name: 'getfile',
  pure: false,
})
export class GetFilePipe implements PipeTransform, OnDestroy {
  private _latestValue: any = null;
  private _latestReturnedValue: any = null;
  private _subscription: Subscription | undefined;
  private _obj: Observable<any> | null;

  private previousUrl: string | undefined;
  private _result: BehaviorSubject<any> = new BehaviorSubject(null);
  private result = this._result.asObservable();
  private _internalSubscription: Subscription | undefined;

  constructor(
    private _ref: ChangeDetectorRef,
    private apiService: DeprecatedApiService,
    private sanitizer: DomSanitizer,
  ) {
    this._obj = null;
  }

  ngOnDestroy(): void {
    if (this._subscription) {
      this._dispose();
    }
  }

  transform(url: string, sanitize: boolean = true): any {
    const obj = this.internalTransform(url, sanitize);
    return this.asyncTrasnform(obj);
  }

  private internalTransform(url: string, sanitize: boolean): Observable<any> {
    if (!url) {
      return this.result;
    }

    if (this.previousUrl !== url) {
      this.previousUrl = url;
      this._internalSubscription = this.apiService.getFile(url).subscribe((m) => {
        this._result.next(sanitize ? this.sanitizer.bypassSecurityTrustUrl(<string>m) : m);
      });
    }

    return this.result;
  }

  private asyncTrasnform(obj: Observable<any>): any {
    if (!this._obj) {
      if (obj) {
        this._subscribe(obj);
      }
      this._latestReturnedValue = this._latestValue;
      return this._latestValue;
    }
    if (obj !== this._obj) {
      this._dispose();
      return this.asyncTrasnform(obj);
    }
    if (this._latestValue === this._latestReturnedValue) {
      return this._latestReturnedValue;
    }
    this._latestReturnedValue = this._latestValue;
    return this._latestValue;
  }

  private _subscribe(obj: Observable<any>) {
    const _this = this;
    this._obj = obj;

    this._subscription = obj.subscribe({
      next: function (value) {
        return _this._updateLatestValue(obj, value);
      },
      error: (e: any) => {
        throw e;
      },
    });
  }

  private _dispose() {
    this._subscription?.unsubscribe();
    this._internalSubscription?.unsubscribe();
    this._internalSubscription = undefined;
    this._latestValue = null;
    this._latestReturnedValue = null;
    this._subscription = undefined;
    this._obj = null;
  }

  private _updateLatestValue(async: any, value: Object) {
    if (async === this._obj) {
      this._latestValue = value;
      this._ref.markForCheck();
    }
  }
}
