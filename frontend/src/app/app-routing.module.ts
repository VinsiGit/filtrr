import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PasteinComponent } from './pastein/pastein.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SettingsComponent } from './settings/settings.component';
import { RetrainComponent } from './retrain/retrain.component';
import { LoginComponent } from './login/login.component';
import { AuthGuard } from './auth.guard';


const routes: Routes = [
  {
    path: "login",
    component: LoginComponent
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
    canActivate: [AuthGuard]
  },
  {
    path: "retrain",
    component: RetrainComponent,
    canActivate: [AuthGuard]
  },
  {
    path: "",
    redirectTo: "dashboard",
    pathMatch: "full"
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
