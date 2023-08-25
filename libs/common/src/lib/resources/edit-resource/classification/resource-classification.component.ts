import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Classification, Resource } from '@nuclia/core';
import { map } from 'rxjs';
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
  noLabels = false;
  kbUrl = this.editResource.kbUrl;
  isAdminOrContrib = this.editResource.isAdminOrContrib;

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
        this.cdr.detectChanges();
      });
  }

  updateLabels(labels: Classification[]) {
    this.currentLabels = labels;
    this.isModified = true;
  }

  cancel() {
    this.currentLabels = [...this.resourceLabels];
    this.isModified = false;
  }

  save() {
    const partial: Partial<Resource> = {
      usermetadata: {
        classifications: this.editResource.getClassificationsPayload(this.currentLabels),
      },
    };
    this.editResource.savePartialResource(partial).subscribe();
  }
}
