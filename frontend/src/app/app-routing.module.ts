import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PasteinComponent } from './pastein/pastein.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SettingsComponent } from './settings/settings.component';
import { RetrainComponent } from './retrain/retrain.component';
import { LoginComponent } from './login/login.component';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin-guard.guard';
import { HelppageComponent } from './helppage/helppage.component';


const routes: Routes = [
  {
    path: "login",
    component: LoginComponent
  },
  {
    path: "help",
    component: HelppageComponent
  },
  {
    path: "dashboard",
    component: DashboardComponent,
    canActivate: [AuthGuard]
  },
  {
    path: "paste-in",
    component: PasteinComponent,
    canActivate: [AuthGuard]
  },
  {
    path: "settings",
    component: SettingsComponent,
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: "retrain",
    component: RetrainComponent,
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: "",
    redirectTo: "paste-in",
    pathMatch: "full"
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
