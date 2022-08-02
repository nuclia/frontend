import {
  Component,
  Input,
  Output,
  EventEmitter,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ViewChildren,
  QueryList,
  ElementRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { ViewportRuler } from '@angular/cdk/scrolling';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AppEntitiesGroup, Entity } from '../model';

const COUNTER_WIDTH = 36;

@Component({
  selector: 'app-synonym-list',
  templateUrl: './synonym-list.component.html',
  styleUrls: ['./synonym-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SynonymListComponent implements OnChanges, AfterViewInit {
  @Input() group?: AppEntitiesGroup;
  @Input() synonyms: Entity[] = [];
  @Input() editMode: boolean = false;
  @Output() unlink = new EventEmitter<Entity>();
  @Output() delete = new EventEmitter<Entity>();

  hiddenItems: number = 0;
  openOverflow: boolean = false;
  unsubscribeAll = new Subject<void>();
  @ViewChildren('item') items?: QueryList<ElementRef>;
  @ViewChild('counter') counter?: ElementRef;

  constructor(private element: ElementRef, private viewportRuler: ViewportRuler, private cdr: ChangeDetectorRef) {
    this.viewportRuler
      .change(200)
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(() => {
        this.updateVisibility();
      });
  }

  ngAfterViewInit(): void {
    this.updateVisibility();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!!changes.synonyms || !!changes.editMode) {
      setTimeout(() => {
        this.updateVisibility();
      }, 10);
    }
  }

  toggleOverflow() {
    this.openOverflow = !this.openOverflow;
    this.cdr.markForCheck();
  }

  updateVisibility() {
    const items = this.items?.toArray() || [];
    const containerPosition = this.element.nativeElement.getBoundingClientRect();
    let hiddenItems = 0;

    // Only show the synonyms that fit into the container
    items.forEach((item: ElementRef, index: number) => {
      const isVisible =
        index === 0 || item.nativeElement.getBoundingClientRect().right <= containerPosition.right - COUNTER_WIDTH;
      item.nativeElement.style.setProperty('opacity', isVisible ? '1' : '0');
      item.nativeElement.style.setProperty('pointer-events', isVisible ? 'auto' : 'none');
      if (!isVisible) {
        hiddenItems = hiddenItems + 1;
      }
    });

    // Set counter position
    if (hiddenItems > 0) {
      const lastVisibleItem = items[items.length - hiddenItems - 1];
      const left = lastVisibleItem.nativeElement.getBoundingClientRect().right - containerPosition.left;
      this.counter?.nativeElement.style.setProperty('opacity', '1');
      this.counter?.nativeElement.style.setProperty('left', left + 'px');
    } else {
      this.counter?.nativeElement.style.setProperty('opacity', '0');
      if (this.openOverflow) {
        this.openOverflow = false;
      }
    }
    this.hiddenItems = hiddenItems;
    this.cdr.detectChanges();
  }
}
