import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { EditResourceService } from '../edit-resource.service';
import { Classification, Resource } from '@nuclia/core';
import { map } from 'rxjs';

@Component({
  templateUrl: './resource-classification.component.html',
  styleUrls: ['./resource-classification.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceClassificationComponent implements OnInit {
  private resourceLabels: Classification[] = [];
  currentLabels: Classification[] = [];
  isModified = false;

  constructor(private editResource: EditResourceService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.editResource.setCurrentView('classification');
    this.editResource.resource.pipe(map((resource) => resource?.getClassifications() || [])).subscribe((labels) => {
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
    this.editResource.save(partial).subscribe();
  }
}
