import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AppUserModule, appRoutes } from '@nuclia/user';

@NgModule({
  imports: [AppUserModule, RouterModule.forChild(appRoutes)],
})
export class LazyUserModule {}
