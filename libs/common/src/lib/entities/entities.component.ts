import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Observable, Subject, tap } from 'rxjs';
import { debounceTime, filter, map, takeUntil } from 'rxjs/operators';
import { generatedEntitiesColor, NerFamily } from './model';
import { NerService } from './ner.service';

@Component({
  selector: 'app-entities',
  templateUrl: './entities.component.html',
  styleUrls: ['./entities.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntitiesComponent implements OnInit, OnDestroy {
  unsubscribeAll = new Subject<void>();
  familyColors = generatedEntitiesColor;
  nerFamilies: Observable<NerFamily[]> = this.nerService.entities.pipe(
    filter((entities): entities is { [key: string]: NerFamily } => !!entities),
    tap((entities) => this.updateSelectedFamilyEntities(entities)),
    map((entities) => this.nerService.getNerFamilyWithTitles(entities)),
  );
  selectedFamily?: NerFamily;
  nerQueryDebounce = new Subject<string>();
  nerQuery = '';

  constructor(
    private nerService: NerService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.nerQueryDebounce.pipe(debounceTime(200), takeUntil(this.unsubscribeAll)).subscribe((query) => {
      this.nerQuery = query;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  onNerQueryChange(newQuery: string) {
    this.nerQueryDebounce.next(newQuery);
  }

  selectFamily(family: NerFamily) {
    this.selectedFamily = family;
    this.cdr.markForCheck();
    if (!family.entities) {
      this.nerService.refreshFamily(family.key).subscribe(() => {
        this.cdr.markForCheck();
      });
    }
  }

  private updateSelectedFamilyEntities(families: { [key: string]: NerFamily }) {
    if (this.selectedFamily) {
      const updatedFamily = families[this.selectedFamily.key];
      if (updatedFamily) {
        this.selectedFamily = {
          ...this.selectedFamily,
          title: updatedFamily.title || this.selectedFamily.title,
          entities: updatedFamily.entities,
        };
        this.cdr.markForCheck();
      }
    }
  }
}
