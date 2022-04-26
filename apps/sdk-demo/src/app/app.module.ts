import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { NgxCaptchaModule } from 'ngx-captcha';
import { AppComponent } from './app.component';
import { WithCredentialsComponent } from './with-credentials.component';
import { AnonymousComponent } from './anonymous.component';

@NgModule({
  declarations: [AppComponent, WithCredentialsComponent, AnonymousComponent],
  imports: [BrowserModule, NgxCaptchaModule, FormsModule],
  bootstrap: [AppComponent],
})
export class AppModule {}
