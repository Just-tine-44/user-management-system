import { NgModule } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { WorkflowsRoutingModule } from './workflows-routing.module';
import { ListComponent } from './list.component';


@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        WorkflowsRoutingModule
    ],
    declarations: [
        ListComponent
        // Add any other components here
    ]
})
export class WorkflowsModule { }