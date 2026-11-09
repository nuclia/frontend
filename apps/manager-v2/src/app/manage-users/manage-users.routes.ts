import { Routes } from '@angular/router';
import { AddUserComponent } from './add-user/add-user.component';
import { ManageUsersComponent } from './manage-users.component';
import { UserDetailsComponent } from './user-details/user-details.component';
import { UserListComponent } from './user-list/user-list.component';

export const MANAGE_USERS_ROUTES: Routes = [
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
