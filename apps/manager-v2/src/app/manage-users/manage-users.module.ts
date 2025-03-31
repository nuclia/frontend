import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ManageUsersComponent } from './manage-users.component';
import { RouterModule, Routes } from '@angular/router';
import { UserListComponent } from './user-list/user-list.component';
import { UserDetailsComponent } from './user-details/user-details.component';
import {
  PaButtonModule,
  PaDateTimeModule,
  PaIconModule,
  PaScrollModule,
  PaTableModule,
  PaTextFieldModule,
} from '@guillotinaweb/pastanaga-angular';
import { ReactiveFormsModule } from '@angular/forms';
import { AddUserComponent } from './add-user/add-user.component';

const ROUTES: Routes = [
  {
    path: '',
    component: ManageUsersComponent,
    children: [
      {
        path: '',
        component: UserListComponent,
      },
      {
        path: 'add',
        component: AddUserComponent,
      },
      {
        path: ':userId',
        component: UserDetailsComponent,
      },
      {
        path: ':userId/edit',
        component: UserDetailsComponent,
      },
    ],
  },
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(ROUTES),
    PaButtonModule,
    PaDateTimeModule,
    PaTableModule,
    PaTextFieldModule,
    PaIconModule,
    ReactiveFormsModule,
    PaScrollModule,
  ],
  declarations: [ManageUsersComponent, UserListComponent, UserDetailsComponent],
})
export class ManageUsersModule {}
