import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Classification, Resource } from '@nuclia/core';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { SelectFirstFieldDirective } from '../select-first-field/select-first-field.directive';
import { takeUntil } from 'rxjs/operators';

@Component({
  templateUrl: './resource-classification.component.html',
  styleUrls: ['../common-page-layout.scss', './resource-classification.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceClassificationComponent extends SelectFirstFieldDirective implements OnInit, OnDestroy {
  private resourceLabels: Classification[] = [];
  currentLabels: Classification[] = [];
  isModified = false;
  hasLabels = false;
  kbUrl = this.editResource.kbUrl;
  isAdminOrContrib = this.editResource.isAdminOrContrib;

  private _hasLabelLoaded = new BehaviorSubject(false);
  private _resourceClassificationLoaded = new BehaviorSubject(false);
  isReady = combineLatest([this._hasLabelLoaded, this._resourceClassificationLoaded]).pipe(
    map(([hasLabelLoaded, resourceClassificationLoaded]) => hasLabelLoaded && resourceClassificationLoaded),
  );

  constructor(private cdr: ChangeDetectorRef) {
    super();
  }

  ngOnInit(): void {
    this.editResource.setCurrentView('classification');
    this.editResource.resource
      .pipe(
        map((resource) => resource?.getClassifications() || []),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe((labels) => {
        this.resourceLabels = labels;
        this.currentLabels = labels;
        this.isModified = false;
        this._resourceClassificationLoaded.next(true);
        this.cdr.detectChanges();
      });
  }

  updateLabels(labels: Classification[]) {
    this.currentLabels = labels;
    this.isModified = true;
    this.cdr.markForCheck();
  }

  cancel() {
    this.currentLabels = [...this.resourceLabels];
    this.isModified = false;
    this.cdr.markForCheck();
  }

  save() {
    const partial: Partial<Resource> = {
      usermetadata: {
        classifications: this.editResource.getClassificationsPayload(this.currentLabels),
      },
    };
    this.editResource.savePartialResource(partial).subscribe();
  }

  updateHasLabels(hasLabel: boolean) {
    this.hasLabels = hasLabel;
    this._hasLabelLoaded.next(true);
    this.cdr.markForCheck();
  }
}
