import {
  Component,
  Input,
  OnInit,
  OnChanges,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
  SimpleChanges,
  Directive,
} from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { Subject, fromEvent } from 'rxjs';
import { takeUntil, auditTime, filter } from 'rxjs/operators';
import { ConnectionPositionPair } from '@angular/cdk/overlay';
import { scrollTo } from './section-navbar.utils';

interface NavItem {
  title: string;
}

export interface SectionInfo extends NavItem {
  element: ElementRef;
}

export interface RouteInfo extends NavItem {
  relativeRoute: string;
}

@Directive({
  selector: 'stf-section-navbar-body',
})
export class SectionNavbarBodyDirective {}

@Directive({
  selector: 'stf-section-navbar-header',
})
export class SectionNavbarHeaderDirective {}

@Directive({
  selector: 'stf-section-navbar-footer',
})
export class SectionNavbarFooterDirective {}

@Component({
  selector: 'stf-section-navbar',
  templateUrl: './section-navbar.component.html',
  styleUrls: ['./section-navbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionNavbarComponent implements OnInit, OnChanges, OnDestroy {
  @Input() title: string = '';
  @Input() sections: SectionInfo[] = [];
  @Input() routes: RouteInfo[] = [];
  @Input() hasInnerRoutes: boolean = false;
  @Input() topbarHeight: number = 0;

  activeIndex: number = -1;
  disableScrollEvents: boolean = false;
  sectionsOpen: boolean = false;
  position = [new ConnectionPositionPair({ originX: 'end', originY: 'bottom' }, { overlayX: 'end', overlayY: 'top' })];

  @ViewChild('navigation') navigation: ElementRef | undefined;
  private unsubscribeAll: Subject<void>;

  constructor(
    private viewportScroller: ViewportScroller,
    private cd: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.unsubscribeAll = new Subject();
  }

  ngOnInit(): void {
    if (this.hasInnerRoutes) {
      this.updateActiveRoute();
      this.router.events
        .pipe(
          filter((event) => event instanceof NavigationEnd),
          takeUntil(this.unsubscribeAll),
        )
        .subscribe(() => {
          this.updateActiveRoute();
        });
    } else {
      fromEvent(window, 'scroll')
        .pipe(
          auditTime(100),
          filter(() => !this.disableScrollEvents),
          takeUntil(this.unsubscribeAll),
        )
        .subscribe(() => {
          this.updateActiveSection();
        });
    }
  }

  get navItems() {
    return (this.hasInnerRoutes ? this.routes : this.sections) as NavItem[];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.routes) {
      this.updateActiveRoute();
    }
    if (changes.sections) {
      this.updateActiveSection();
    }
  }

  updateActiveSection() {
    let threshold = 110;
    if (window.innerWidth < 1280 && this.navigation) {
      threshold += this.navigation.nativeElement.clientHeight;
    }
    let sectionIndex = 0;
    this.sections.forEach((section: SectionInfo, index: number) => {
      const { top } = section.element.nativeElement.getBoundingClientRect();
      if (top < threshold) {
        sectionIndex = index;
      }
    });
    if (this.activeIndex != sectionIndex) {
      this.activeIndex = sectionIndex;
      this.cd.markForCheck();
    }
  }

  updateActiveRoute() {
    this.activeIndex =
      this.routes?.findIndex((route) => {
        const urlTree = this.router.createUrlTree([route.relativeRoute], { relativeTo: this.route });
        return this.router.isActive(urlTree, true);
      }) || 0;
    this.cd.markForCheck();
  }

  onClick(index: number) {
    if (this.hasInnerRoutes) {
      this.router.navigate([this.routes[index].relativeRoute], { relativeTo: this.route });
    } else {
      this.activeIndex = index;
      this.disableScrollEvents = true;
      this.cd.markForCheck();

      scrollTo(this.getSectionScrollPosition(index), 500);

      setTimeout(() => {
        this.disableScrollEvents = false;
      }, 510);
    }
  }

  getSectionScrollPosition(index: number): number {
    const sectionOffset = this.sections[index].element.nativeElement.getBoundingClientRect().top;
    const top = this.viewportScroller.getScrollPosition()[1];
    let nextTop = top + sectionOffset - this.topbarHeight;

    if (window.innerWidth < 1280 && this.navigation) {
      nextTop -= this.navigation!.nativeElement.clientHeight;
    }
    return nextTop;
  }

  toggleSelect() {
    this.sectionsOpen = !this.sectionsOpen;
    this.cd.markForCheck();
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
