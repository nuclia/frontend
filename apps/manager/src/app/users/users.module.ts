import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersListComponent } from './users-list/users-list.component';
import { UsersDetailComponent } from './users-detail/users-detail.component';
import { RouterModule, Routes } from '@angular/router';
import { LoggedinGuard } from '@flaps/core';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatLegacyPaginatorModule as MatPaginatorModule } from '@angular/material/legacy-paginator';
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatSortModule } from '@angular/material/sort';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { UserResolve } from '../resolvers/user.resolver';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { STFInputModule } from '../inputfield/input-module';
import { SisProgressModule } from '@nuclia/sistema';

const usersRoutes: Routes = [
  {
    path: '',
    canActivateChild: [LoggedinGuard],
    children: [
      {
        path: '',
        component: UsersListComponent,
      },
      {
        path: '+new',
        component: UsersDetailComponent,
      },
      {
        path: ':user',
        component: UsersDetailComponent,
        resolve: {
          user: UserResolve,
        },
      },
    ],
  },
];

@NgModule({
  declarations: [UsersListComponent, UsersDetailComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatListModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatTableModule,
    MatInputModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    STFInputModule,
    FlexLayoutModule,
    RouterModule.forChild(usersRoutes),
    TranslateModule.forChild(),
    PaButtonModule,
    SisProgressModule,
  ],
  exports: [RouterModule],
})
export class UsersModule {}
