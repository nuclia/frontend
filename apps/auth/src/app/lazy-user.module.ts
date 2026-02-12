import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { authRoutes, AuthUserModule } from '@nuclia/user';

@NgModule({
  imports: [AuthUserModule, RouterModule.forChild(authRoutes)],
})
export class LazyUserModule {}
