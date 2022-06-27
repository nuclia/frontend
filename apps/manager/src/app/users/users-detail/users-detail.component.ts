import { Component, OnInit } from '@angular/core';
import { formatDate } from '@angular/common';
import { UsersService } from './../../services/users.service';
import { User, UserPatch, UserCreation, Session } from './../../models/user.model';
import { ActivatedRoute, Router } from '@angular/router';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { SDKService } from '@flaps/auth';

@Component({
  selector: 'app-users-detail',
  templateUrl: './users-detail.component.html',
  styleUrls: ['./users-detail.component.scss'],
})
export class UsersDetailComponent implements OnInit {
  edit: boolean = false;
  editId: string | undefined;
  isRoot: boolean = false;
  user: User | undefined;
  sessions: Session[] | undefined;

  message: string | undefined;

  prefsForm = this.fb.group({
    id: [{ value: '', disabled: true }],
    name: ['', [Validators.required]],
    email: ['', [Validators.required]],
    type: ['', [Validators.required]],
    language: ['', [Validators.required]],
    last_login: [{ value: '', disabled: true }],
    providers: [{ value: '', disabled: true }],
  });

  prefsDataForm = this.fb.group({});

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private usersService: UsersService,
    private sdk: SDKService,
    private fb: UntypedFormBuilder,
  ) {
    this.route.data.subscribe((data: { [user: string]: User }) => {
      const user = data.user;
      if (user) {
        this.edit = true;

        const formValues = {
          id: user.id,
          name: user.name,
          email: user.email,
          type: user.type,
          language: user.language,
          providers: user.providers.join(', '),
          last_login: user.last_login && formatDate(user.last_login, 'dd/LL/yyyy HH:mm', 'en-US'),
        };
        this.prefsForm.patchValue(formValues);

        // this.prefsDataForm.patchValue(user.data);  // is this needed anymore ?
        // this.sessions = user.sessions; // Not implemented in backend yet
      } else {
        this.prefsForm.patchValue({
          type: 'USER',
          providers: 'LOCAL',
        });
      }
    });
    if (this.sdk.nuclia.auth.getJWTUser()?.ext.type === 'r') {
      this.isRoot = true;
    }
  }

  ngOnInit() {}

  reset() {
    this.usersService.reset(this.prefsForm.controls.id.value).subscribe(
      (res: any) => {
        this.returnToUsers();
      },
      (err: any) => {
        if (err.error) {
          this.message = err.error.message;
        } else {
          this.message = err.message;
        }
      },
    );
  }

  save() {
    if (this.prefsForm.valid) {
      const data: UserPatch = {
        type: this.prefsForm.controls.type.value,
        email: this.prefsForm.controls.email.value,
        language: this.prefsForm.controls.language.value,
        name: this.prefsForm.controls.name.value,
      };
      this.usersService.edit(this.prefsForm.controls.id.value, data).subscribe(
        (res: any) => {
          this.returnToUsers();
        },
        (err: any) => {
          if (err.error) {
            this.message = err.error.message;
          } else {
            this.message = err.message;
          }
        },
      );
    }
  }

  delete() {
    if (confirm('Are you sure?')) {
      this.usersService.deleteUser(this.prefsForm.controls.id.value).subscribe(
        (res: any) => {
          this.returnToUsers();
        },
        (err: any) => {
          if (err.error) {
            this.message = err.error.message;
          } else {
            this.message = err.message;
          }
        },
      );
    }
  }

  add() {
    if (this.prefsForm.valid) {
      const data: UserCreation = {
        name: this.prefsForm.controls.name.value,
        email: this.prefsForm.controls.email.value,
        language: this.prefsForm.controls.language.value,
        type: this.prefsForm.controls.type.value,
      };
      this.usersService.create(data).subscribe(
        (res: any) => {
          this.returnToUsers();
        },
        (err: any) => {
          if (err.error) {
            this.message = err.error.message;
          } else {
            this.message = err.message;
          }
        },
      );
    }
  }
  returnToUsers() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }
}
