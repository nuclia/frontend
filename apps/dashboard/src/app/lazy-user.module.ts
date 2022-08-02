import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { UserModule, userRoutes } from '@flaps/common';

@NgModule({
  imports: [UserModule, RouterModule.forChild(userRoutes)],
})
export class LazyUserModule {}
