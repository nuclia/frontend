import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../user.service';
import { SisToastService } from '@nuclia/sistema';
import { filter, map, Subject, switchMap } from 'rxjs';
import { FormControl, FormGroup } from '@angular/forms';
import { Location } from '@angular/common';

@Component({
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDetailsComponent implements OnInit, OnDestroy {
  private unsubscribeAll = new Subject<void>();

  userEmail = '';
  userForm = new FormGroup({
    email: new FormControl(''),
    id: new FormControl(''),
    language: new FormControl(''),
    last_login: new FormControl(''),
    name: new FormControl(''),
    providers: new FormControl(''),
    type: new FormControl(''),
  });

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private toast: SisToastService,
    private cdr: ChangeDetectorRef,
    private location: Location,
  ) {}

  ngOnInit() {
    this.route.params
      .pipe(
        filter((params) => !!params['userId']),
        map((params) => params['userId'] as string),
        switchMap((userId) => this.userService.getUser(userId)),
      )
      .subscribe((user) => {
        this.userEmail = user.email;
        this.userForm.patchValue({ ...user, providers: user.providers.join(', ') });
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  goBack() {
    this.location.back();
  }
}
