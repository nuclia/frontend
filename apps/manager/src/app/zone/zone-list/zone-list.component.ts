import { Component, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ZoneService } from '../../services/zone.service';
import { ZoneSummary } from '../../models/zone.model';

@Component({
  selector: 'app-zone-list',
  templateUrl: './zone-list.component.html',
  styleUrls: ['./zone-list.component.scss'],
})
export class ZoneListComponent implements OnDestroy {
  displayedColumns: string[] = ['id', 'title', 'created', 'external', 'actions'];

  zones: MatTableDataSource<ZoneSummary> | undefined;

  search_zone: string = '';
  unsubscribeAll = new Subject<void>();

  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;

  constructor(private route: ActivatedRoute, private router: Router, private zoneService: ZoneService) {
    this.route.data
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(data => {
        this.zones = new MatTableDataSource(data.zones);
    });
  }

  applyFilter(filterValue: string) {
    this.zones!.filter = filterValue.trim().toLowerCase();
    if (this.zones?.paginator) {
      this.zones.paginator.firstPage();
    }
  }

  refresh() {
    this.zoneService.getZones().subscribe((zones: ZoneSummary[]) => { 
      this.zones = new MatTableDataSource(zones);
    });
  }

  editZone(row: any) {
    this.router.navigate(['/zones/' + row.id]);
  }

  addNewZone() {
    this.router.navigate(['/zones/new']);
  }

  deleteZone(zoneId: string) {
    if (confirm('Are you sure?')) {
      this.zoneService.delete(zoneId).subscribe(() => { this.refresh() });
    }
  }

  ngOnDestroy() {
    if (this.unsubscribeAll) {
      this.unsubscribeAll.next();
      this.unsubscribeAll.complete();
    }
  }
}
