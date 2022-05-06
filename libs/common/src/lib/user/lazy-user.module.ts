import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { UserModule, userRoutes } from './user.module';

@NgModule({
  imports: [UserModule, RouterModule.forChild(userRoutes)],
})
export class LazyUserModule {}
