import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
<<<<<<< HEAD
import { UserModule, userRoutes } from '@nuclia/user';

@NgModule({
  imports: [UserModule, RouterModule.forChild(userRoutes)],
=======
import { authRoutes, AuthUserModule } from '@nuclia/user';

@NgModule({
  imports: [AuthUserModule, RouterModule.forChild(authRoutes)],
>>>>>>> 0c3bc8f9 (login)
})
export class LazyUserModule {}
