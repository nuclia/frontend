import { AccountResolve } from './resolvers/account.resolver';
import { AccountService } from './services/account.service';
import { DealerService } from './services/dealer.service';
import { UsersService } from './services/users.service';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { environment } from '../environments/environment';
import { FlexLayoutModule } from '@angular/flex-layout';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { AppInitService, STFConfigModule } from '@flaps/core';
import { ReactiveFormsModule } from '@angular/forms';
import { DashboardModule } from './dashboard/dashboard.module';
import { MatIconModule } from '@angular/material/icon';
import { AccountsResolve } from './resolvers/accounts.resolver';
import { DealerResolve } from './resolvers/dealer.resolver';
import { DealersResolve } from './resolvers/dealers.resolver';
import { UserResolve } from './resolvers/user.resolver';
import { StashResolve } from './resolvers/stash.resolver';
import { ZoneResolve } from './resolvers/zone.resolver';
import { ZonesResolve } from './resolvers/zones.resolver';
import { AngularSvgIconModule } from 'angular-svg-icon';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, '/assets/i18n/', '.json');
}

@NgModule({
  declarations: [AppComponent, PageNotFoundComponent],
  imports: [
    BrowserModule,
    MatIconModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FlexLayoutModule,
    DashboardModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    AppRoutingModule,
    AngularSvgIconModule.forRoot(),
    STFConfigModule.forRoot(environment),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient],
      },
    }),
  ],
  providers: [
    // { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
    AppInitService,
    UsersService,
    DealerService,
    AccountService,
    AccountResolve,
    AccountsResolve,
    DealerResolve,
    DealersResolve,
    UserResolve,
    StashResolve,
    ZoneResolve,
    ZonesResolve,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
