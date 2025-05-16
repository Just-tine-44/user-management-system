import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { first } from 'rxjs/operators';

import { DepartmentService } from '../../_services/departments.service';
import { AccountService } from '@app/_services'; 
import { AlertService } from '../../_services/alert.service';
import { Department } from '../../_models/departments';

@Component({
  templateUrl: 'list.component.html'
})
export class ListComponent implements OnInit {
  departments: Department[] = [];
  loading = false;
  
  constructor(
    private departmentService: DepartmentService,
    private accountService: AccountService,
    private alertService: AlertService,
    private router: Router
  ) {}
  
  ngOnInit() {
    this.loadDepartments();
  }
  
  account() {
    return this.accountService.accountValue;
  }
  
  loadDepartments() {
    this.loading = true;
    this.departmentService.getAll()
      .pipe(first())
      .subscribe(
        departments => {
          this.departments = departments;
          this.loading = false;
        },
        error => {
          this.alertService.error('Error loading departments');
          this.loading = false;
          console.error(error);
        }
      );
  }
  
  add() {
    this.router.navigate(['admin/departments/add']);
  }
  
  edit(id: string) {
    this.router.navigate(['admin/departments/edit', id]);
  }
  
  delete(id: string) {
    const department = this.departments.find(x => x.id === id);
    if (!department) return;
    
    if (department.employeeCount && department.employeeCount > 0) {
      this.alertService.error('Cannot delete department with employees');
      return;
    }
    
    if (confirm(`Are you sure you want to delete the department "${department.name}"?`)) {
      this.departmentService.delete(id)
        .pipe(first())
        .subscribe(
          () => {
            this.departments = this.departments.filter(x => x.id !== id);
            this.alertService.success('Department deleted successfully');
          },
          error => {
            this.alertService.error('Error deleting department');
            console.error(error);
          }
        );
    }
  }
}