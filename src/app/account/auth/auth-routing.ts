import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { PasswordresetComponent } from './passwordreset/passwordreset.component';
import { VerifyComponent } from './verify/verify.component';
import { AffiliationComponent } from './affiliation/affiliation.component';
import { SegundoFactorComponent } from './segundo-factor/segundo-factor.component';
import { CambiarContrasenaComponent } from './cambiar-contrasena/cambiar-contrasena.component';

const routes: Routes = [
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'signup',
        component: SignupComponent
    },
    {
        path: 'reset-password',
        component: PasswordresetComponent
    },
    {
        path: 'verify',
        component: VerifyComponent
    },
    {
        path: 'afiliacion',
        component: AffiliationComponent
    },
    {
        path: 'segundo-factor',
        component: SegundoFactorComponent
    },
    {
        path: 'cambiar-contrasena',
        component: CambiarContrasenaComponent
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AuthRoutingModule { }
