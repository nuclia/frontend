import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, delay } from 'rxjs/operators';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { SelectionModel } from '@angular/cdk/collections';
import { MatDialog } from '@angular/material/dialog';
import { AppEntitiesGroup, MutableEntitiesGroup, Entity } from '../model';
import { EntitiesEditService } from '../entities-edit.service';
import { EntitiesSearchService } from '../entities-search.service';
import {
  EntityDialogComponent,
  EntityDialogMode,
  EntityDialogData,
  EntityDialogResponse
} from '../entity-dialog/entity-dialog.component';


@Component({
  selector: 'app-entity-list',
  templateUrl: './entity-list.component.html',
  styleUrls: ['./entity-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntityListComponent implements OnInit, OnDestroy {
  @Input() editMode: boolean = false;
  @Input() groupKey: string = '';
  @Input() group: AppEntitiesGroup | undefined;
  @Input() searchTerm: string = '';
  @Input() searchResults: string[] | null = null;
  
  editableGroup: MutableEntitiesGroup | null = null;
  highlightedEntities = new SelectionModel<string>(true);
  minVirtualScrollItems = 50;
  unsubscribeAll = new Subject<void>();

  @ViewChild('virtualContainer') virtualContainer?: CdkVirtualScrollViewport;
  @ViewChild('container') container?: ElementRef; 

  constructor(
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private editService: EntitiesEditService,
    private searchService: EntitiesSearchService,
  ) {}

  get entitiesGroup(): AppEntitiesGroup | undefined {
    return this.editableGroup || this.group;
  }

  ngOnInit(): void {
    this.editService.getGroup(this.groupKey)
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe((entitiesGroup) => {
        this.editableGroup = entitiesGroup;
        this.cdr.markForCheck();
      });

    this.editService.getAddedEntity(this.groupKey)
      .pipe(
        delay(10), // Wait until the new entity is added to the DOM
        takeUntil(this.unsubscribeAll))
      .subscribe((entity) => {
        this.scrollToEntity(entity);
        this.highlightedEntities.toggle(entity.value);
        this.cdr.markForCheck();
        setTimeout(() => {
          this.highlightedEntities.toggle(entity.value);
          this.cdr.markForCheck();
        }, 2000);
      });
  }

  filteredEntities(): Entity[] {
    let entities = Object.entries(this.entitiesGroup?.entities || [])
      .map(([key, value]) => value)
      .filter((entity) => !entity.merged);

    if (this.searchResults) {
      entities = entities.filter((entity) => this.searchResults!.includes(entity.value));
    }
    return entities.sort((a, b) => a.value.localeCompare(b.value));
  }

  addSynonym(entity: Entity, synonym: Entity) {
    this.editableGroup!.addSynonym(entity.value, synonym.value);
    this.editService.setGroup(this.groupKey, this.editableGroup!);
    this.cdr.markForCheck();
  }

  unlinkSynonym(entity: Entity, synonym: Entity) {
    this.editableGroup!.unlinkSynonym(entity.value, synonym.value);
    this.editService.setGroup(this.groupKey, this.editableGroup!);
    this.cdr.markForCheck();
  }

  deleteEntity(entity: Entity) {
    this.editableGroup?.deleteEntity(entity.value);
    this.editService.setGroup(this.groupKey, this.editableGroup!);
    this.cdr.markForCheck();
  }

  viewEntity(entity: Entity) {
    this.openDialog('view', entity);
  }

  editEntity(entity: Entity) {
    const dialogRef = this.openDialog('edit', entity);
    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe((result) => {
        if (result) {
          // TODO
        }
      });
  }

  openDialog(mode: EntityDialogMode, entity?: Entity) {
    const dialogRef = this.dialog.open<
      EntityDialogComponent,
      EntityDialogData,
      EntityDialogResponse>
      (EntityDialogComponent, {
        width: '630px',
        data: { mode, entity, group: this.groupKey }
      });

    return dialogRef;
  }

  isHighlighted(entity: Entity): boolean {
    return this.highlightedEntities.isSelected(entity.value);
  }

  scrollToEntity(entity: Entity) {
    const index = this.filteredEntities().findIndex((item) => item.value === entity.value);
    if (this.virtualContainer) {
      this.virtualContainer.scrollToIndex(index);
    }
    else if(this.container) {
      this.container.nativeElement.scrollTop = index * 50;
    }
  }

  preserveOrder() {
    return 0;
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
