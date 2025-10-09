import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../user.service';
import { SisToastService } from '@nuclia/sistema';
import { filter, map, Subject, switchMap } from 'rxjs';
import { FormControl, FormGroup } from '@angular/forms';
import { User } from '../user.models';
import { UserType } from '@nuclia/core';
import { ManagerStore } from '../../manager.store';

@Component({
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class UserDetailsComponent implements OnInit, OnDestroy {
  private unsubscribeAll = new Subject<void>();
  private router = inject(Router);
  private toaster = inject(SisToastService);
  private store = inject(ManagerStore);
  canEdit = this.store.canEdit;
  userEmail = '';
  userId = '';
  userForm = new FormGroup({
    email: new FormControl('', { nonNullable: true }),
    id: new FormControl('', { nonNullable: true }),
    language: new FormControl('', { nonNullable: true }),
    last_login: new FormControl('', { nonNullable: true }),
    name: new FormControl('', { nonNullable: true }),
    providers: new FormControl('', { nonNullable: true }),
    type: new FormControl<UserType>('USER', { nonNullable: true }),
  });
  isEdit = this.router.url.endsWith('edit');
  isSaving = false;

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private toast: SisToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.route.params
      .pipe(
        filter((params) => !!params['userId']),
        map((params) => params['userId'] as string),
        switchMap((userId) => this.userService.getUser(userId)),
      )
      .subscribe({
        next: (user) => {
          this.userEmail = user.email;
          this.userId = user.id;
          this.userForm.patchValue({
            ...user,
            providers: user.providers.join(', '),
            last_login: user.last_login || '',
          });
          this.cdr.markForCheck();
        },
        error: (error) => {
          const message =
            error.status === 404 ? `This user doesn't exist anymore` : 'An error occurred while loading the user';
          this.toast.error(message);
        },
      });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  goBack() {
    this.router.navigate(['/users']);
  }

  edit() {
    this.router.navigate(['./edit'], { relativeTo: this.route });
  }

  cancel() {
    this.router.navigate(['..'], { relativeTo: this.route });
  }

  save() {
    this.isSaving = true;
    this.cdr.detectChanges();
    const data = this.userForm.getRawValue();
    const payload: Partial<User> = {
      email: data.email,
      name: data.name,
    };
    if (data.type) {
      payload.type = data.type;
    }
    this.userService.modifyUser(this.userId, payload).subscribe({
      next: (user) => {
        this.isSaving = false;
        this.cdr.detectChanges();
        this.router.navigate([`/users/${user.id}`]);
      },
      error: (error) => {
        this.isSaving = false;
        this.cdr.detectChanges();
        this.toaster.error(JSON.stringify(error));
      },
    });
  }
}
