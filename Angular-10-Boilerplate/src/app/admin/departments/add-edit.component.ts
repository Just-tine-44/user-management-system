import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { first } from 'rxjs/operators';

import { DepartmentService } from '../../_services/departments.service';
import { AlertService } from '../../_services/alert.service';
import { Department } from '../../_models/departments';
import { EmployeeService } from '../../_services/employees.service';
import { Employee } from '../../_models/employees';

@Component({
  templateUrl: 'add-edit.component.html'
})
export class AddEditComponent implements OnInit {
  id: string;
  department: Department = {
    id: '',
    name: '',
    description: '',
    location: '',
    status: 'Active'
  };
  employees: Employee[] = []; 
  loading = false;
  submitted = false;
  errorMessage = '';
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private departmentService: DepartmentService,
    private employeeService: EmployeeService,
    private alertService: AlertService
  ) {}
  
  ngOnInit() {
    this.id = this.route.snapshot.params['id'];
    
    // Get all employees for manager selection dropdown
    this.employeeService.getAll()
      .pipe(first())
      .subscribe(
        employees => this.employees = employees,
        error => {
          this.errorMessage = 'Could not load employees';
          console.error(error);
        }
      );
    
    // If editing an existing department, load its data
    if (this.id) {
      this.loading = true;
      this.departmentService.getById(this.id)
        .pipe(first())
        .subscribe(
          department => {
            this.loading = false;
            this.department = department;
          },
          error => {
            this.loading = false;
            this.errorMessage = 'Could not load department data';
            console.error(error);
            this.alertService.error('Error loading department');
          }
        );
    }
  }
  
  save() {
    this.submitted = true;
    
    // Validate form
    if (!this.department.name) {
      this.errorMessage = 'Department name is required';
      return;
    }
    
    this.loading = true;
    
    if (this.id) {
      // Update existing department
      this.departmentService.update(this.id, this.department)
        .pipe(first())
        .subscribe(
          data => {
            this.alertService.success('Department updated', { keepAfterRouteChange: true });
            this.router.navigate(['../../'], { relativeTo: this.route });
          },
          error => {
            this.loading = false;
            this.errorMessage = error || 'Error updating department';
            console.error(error);
            this.alertService.error(this.errorMessage);
          }
        );
    } else {
      // Create new department
      this.departmentService.create(this.department)
        .pipe(first())
        .subscribe(
          data => {
            this.alertService.success('Department created', { keepAfterRouteChange: true });
            this.router.navigate(['../'], { relativeTo: this.route });
          },
          error => {
            this.loading = false;
            this.errorMessage = error || 'Error creating department';
            console.error(error);
            this.alertService.error(this.errorMessage);
          }
        );
    }
  }
  
  cancel() {
    if (this.id) {
      this.router.navigate(['../../'], { relativeTo: this.route });
    } else {
      this.router.navigate(['../'], { relativeTo: this.route });
    }
  }
}