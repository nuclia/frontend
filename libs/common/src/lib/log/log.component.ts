import { Component, OnInit, Input } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'stf-log',
  templateUrl: './log.component.html',
  styleUrls: ['./log.component.css'],
})
export class LogComponent implements OnInit {
  @Input() entry: string | undefined;

  elements: string[] = [];
  type: string = 'NaN';
  when: string = 'NaN';
  db: string = 'NaN';
  account: string = 'NaN';
  stash: string = 'NaN';
  uuid: string = 'NaN';
  id: string = 'NaN';
  user: string = 'NaN';
  title: string = 'NaN';
  @Input() short: boolean = false;
  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    if (this.entry !== undefined) {
      this.elements = this.entry.split(' - ');
      this.type = this.elements[0];
      this.when = this.elements[1];
      this.db = this.elements[2];
      this.account = this.elements[3];
      this.stash = this.elements[4];
      this.uuid = this.elements[5];
      this.user = this.elements[6];
      this.title = this.elements[7];
      this.id = this.elements[8];
    }
  }

  goToUUID(id: string) {
    this.router.navigate([{ outlets: { resource: 'r/' + id } }], {
      relativeTo: this.route.parent,
      queryParamsHandling: 'merge',
    });
  }
}
