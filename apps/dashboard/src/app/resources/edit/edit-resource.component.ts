import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { filter, map, Observable } from 'rxjs';
import { Resource } from '@nuclia/core';
import { EditResourceService, EditResourceView } from './edit-resource.service';
import { NavigationService } from '../../services/navigation.service';

@Component({
  selector: 'app-edit-resource',
  templateUrl: 'edit-resource.component.html',
  styleUrls: ['edit-resource.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class EditResourceComponent implements OnInit, OnDestroy {
  resource: Observable<Resource | null> = this.editResource.resource;
  currentView: EditResourceView | null = null;
  backRoute: Observable<string> = this.navigationService.homeUrl.pipe(map((homeUrl) => `${homeUrl}/resources`));

  constructor(
    private route: ActivatedRoute,
    private editResource: EditResourceService,
    private navigationService: NavigationService,
    private cdr: ChangeDetectorRef,
  ) {
    this.route.params
      .pipe(filter((params) => !!params.id))
      .subscribe((params) => this.editResource.loadResource(params.id));
  }

  ngOnInit() {
    this.editResource.currentView.subscribe((view) => {
      this.currentView = view;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy() {
    this.editResource.reset();
  }
}
