import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { RequestsRoutingModule } from './requests-routing.module';
import { ListComponent } from './list.component';
import { AddEditComponent } from './add-edit.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RequestsRoutingModule
    ],
    declarations: [
        ListComponent,
        AddEditComponent
    ]
})
export class RequestsModule { }