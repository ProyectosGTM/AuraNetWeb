import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SegundoFactorComponent } from './segundo-factor/segundo-factor.component';
import { AuthEscenaComponent } from './auth-escena/auth-escena.component';
import { CambiarContrasenaComponent } from './cambiar-contrasena/cambiar-contrasena.component';

import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';

import { UIModule } from '../../shared/ui/ui.module';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { AuthRoutingModule } from './auth-routing';
import { PasswordresetComponent } from './passwordreset/passwordreset.component';
import { VerifyComponent } from './verify/verify.component';
import { AffiliationComponent } from './affiliation/affiliation.component';

@NgModule({
  declarations: [LoginComponent, SignupComponent, PasswordresetComponent, VerifyComponent, AffiliationComponent, SegundoFactorComponent, CambiarContrasenaComponent, AuthEscenaComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbAlertModule,
    UIModule,
    AuthRoutingModule
  ]
})
export class AuthModule { }
