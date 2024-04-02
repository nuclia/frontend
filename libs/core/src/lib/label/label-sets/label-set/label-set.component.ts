import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MutableLabelSet } from '../model';

@Component({
  selector: 'app-label-set',
  templateUrl: './label-set.component.html',
  styleUrls: ['./label-set.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelSetComponent implements OnInit, OnDestroy {
  labelSet?: MutableLabelSet;
  labelSetId?: string;
  addNew = false;
  unsubscribeAll = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.unsubscribeAll)).subscribe((params) => {
      this.labelSetId = params['labelSet'];
      this.addNew = !params['labelSet'];
      this.cdr.detectChanges();
    });
  }

  goToLabelSetList() {
    this.router.navigate(['..'], { relativeTo: this.route });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
