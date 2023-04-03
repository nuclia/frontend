import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { Subject } from 'rxjs';
import { delay, takeUntil } from 'rxjs/operators';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { SelectionModel } from '@angular/cdk/collections';
import { CdkDragDrop, CdkDragEnter, CdkDragExit } from '@angular/cdk/drag-drop';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { AppEntitiesGroup, Entity, MutableEntitiesGroup } from '../model';
import { EntitiesEditService } from '../entities-edit.service';
import {
  EntityDialogComponent,
  EntityDialogData,
  EntityDialogMode,
  EntityDialogResponse,
} from '../entity-dialog/entity-dialog.component';

@Component({
  selector: 'app-entity-list',
  templateUrl: './entity-list.component.html',
  styleUrls: ['./entity-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityListComponent implements OnInit, OnDestroy {
  @Input() editMode: boolean = false;
  @Input() group: AppEntitiesGroup | undefined;
  @Input() searchTerm: string | null = '';
  @Input() searchResults: string[] | null = null;

  editableGroup: MutableEntitiesGroup | null = null;
  highlightedEntities = new SelectionModel<string>(true);
  entityHeight = 50;
  maxListHeight = 500;
  unsubscribeAll = new Subject<void>();

  @ViewChild('virtualContainer') virtualContainer?: CdkVirtualScrollViewport;

  constructor(
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private editService: EntitiesEditService,
    private renderer2: Renderer2,
  ) {}

  get entitiesGroup(): AppEntitiesGroup | undefined {
    return this.editableGroup || this.group;
  }

  ngOnInit(): void {
    this.editService
      .getGroup(this.group!.key)
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe((entitiesGroup) => {
        this.editableGroup = entitiesGroup;
        this.cdr.markForCheck();
      });

    this.editService
      .getAddedEntity(this.group!.key)
      .pipe(
        delay(10), // Wait until the new entity is added to the DOM
        takeUntil(this.unsubscribeAll),
      )
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

  dragEnter(event: CdkDragEnter<any>) {
    if (event.container.data.value !== event.item.data.value) {
      this.renderer2.setStyle(event.container.element.nativeElement, 'background-color', 'rgba(255, 220, 27,0.1)');
    }
  }

  dragExit(event: CdkDragExit<any>) {
    if (event.container.data.value !== event.item.data.value) {
      this.renderer2.removeStyle(event.container.element.nativeElement, 'background-color');
    }
  }

  dragDrop(event: CdkDragDrop<Entity, any, Entity>) {
    this.addSynonym(event.container.data, event.item.data);
    this.renderer2.removeStyle(event.container.element.nativeElement, 'background-color');
  }

  addSynonym(entity: Entity, synonym: Entity) {
    this.editableGroup!.addSynonym(entity.value, synonym.value);
    this.editService.setGroup(this.group!.key, this.editableGroup!);
    this.cdr.markForCheck();
  }

  unlinkSynonym(entity: Entity, synonym: Entity) {
    this.editableGroup!.unlinkSynonym(entity.value, synonym.value);
    this.editService.setGroup(this.group!.key, this.editableGroup!);
    this.cdr.markForCheck();
  }

  deleteEntity(entity: Entity) {
    this.editableGroup?.deleteEntity(entity.value);
    this.editService.setGroup(this.group!.key, this.editableGroup!);
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
    const dialogRef = this.dialog.open<EntityDialogComponent, EntityDialogData, EntityDialogResponse>(
      EntityDialogComponent,
      {
        width: '630px',
        data: { mode, entity, group: this.group!.key },
      },
    );

    return dialogRef;
  }
  getListHeight(): number {
    return Math.min(this.filteredEntities().length * this.entityHeight, this.maxListHeight);
  }

  isHighlighted(entity: Entity): boolean {
    return this.highlightedEntities.isSelected(entity.value);
  }

  scrollToEntity(entity: Entity) {
    const index = this.filteredEntities().findIndex((item) => item.value === entity.value);
    if (this.virtualContainer) {
      this.virtualContainer.scrollToIndex(index);
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
