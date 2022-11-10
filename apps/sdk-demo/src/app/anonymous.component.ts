import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { KnowledgeBox, Search } from '@nuclia/core';
import { switchMap } from 'rxjs';
import { MyService } from './service';

@Component({
  selector: 'sdk-demo-anonymous',
  templateUrl: './anonymous.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnonymousComponent {
  isAuthenticated = this.service.nuclia.auth.isAuthenticated();
  kb: KnowledgeBox;
  query = '';
  searchResults?: Search.Results;

  constructor(private service: MyService, private cdr: ChangeDetectorRef) {
    this.service.reinit(true);
    this.kb = this.service.nuclia.knowledgeBox;
    this.widgets();
  }

  search() {
    this.kb
      .search(this.query)
      .pipe(
        switchMap((results) => this.kb.getResource(Object.values(results.resources)[0].id)),
        switchMap((res) => res.search(this.query, [Search.ResourceFeatures.PARAGRAPH])),
      )
      .subscribe((res) => {
        this.searchResults = res;
        this.cdr?.markForCheck();
      });
  }

  async widgets() {
    const widgets = await this.service.nuclia.asyncKnowledgeBox.getWidgets();
    console.log(widgets);
  }
}
