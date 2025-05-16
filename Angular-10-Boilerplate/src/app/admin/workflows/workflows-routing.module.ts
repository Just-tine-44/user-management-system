import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ListComponent } from './list.component';
import { AuthGuard } from '../../_helpers/auth.guard';
import { Role } from '../../_models/role';

const routes: Routes = [
    // Most specific routes first
    {
        path: 'view/:id',
        component: ListComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'employee/:employeeId',
        component: ListComponent,
        canActivate: [AuthGuard],
        data: { 
            validateAccess: (route, account) => {
                const employeeId = route.params.employeeId;
                // Allow if admin
                if (account.role === Role.Admin) return true;
                
                // Otherwise, handle detailed check in component
                return true; // Fallback - component will handle detailed check
            }
        }
    },
    // Handle direct access to workflows route
    {
        path: '', 
        component: ListComponent,
        canActivate: [AuthGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class WorkflowsRoutingModule { }