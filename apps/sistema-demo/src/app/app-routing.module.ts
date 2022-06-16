import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { menu } from './app.component';
import { WelcomePageComponent } from './welcome-page/welcome-page.component';
import { WelcomePageModule } from './welcome-page/welcome-page.module';

function buildRoutesFromMenu() {
  const routes: Routes = [{ path: '', pathMatch: 'full', component: WelcomePageComponent }];
  menu.forEach((section) =>
    section.pages.forEach((page) => routes.push({path: page.view, component: page.type})),
  );
  return routes;
}

const appRoutes: Routes = buildRoutesFromMenu();

@NgModule({
  imports: [RouterModule.forRoot(appRoutes), WelcomePageModule],
  exports: [RouterModule]
})
export class AppRoutingModule { }
