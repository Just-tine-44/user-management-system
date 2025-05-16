import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AccountService } from '../../_services/account.service';
import { AlertService } from '../../_services/alert.service';
import { EmployeeService } from '../../_services/employees.service';
import { DepartmentService } from '../../_services/departments.service';

@Component({
  templateUrl: 'add-edit.component.html'
})
export class AddEditComponent implements OnInit {
  form: FormGroup;
  id: string;
  isAddMode: boolean;
  users: any[] = [];
  departments: any[] = [];
  loading = false;
  submitted = false;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private accountService: AccountService,
    private employeeService: EmployeeService,
    private departmentService: DepartmentService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.id = this.route.snapshot.params['id'];
    this.isAddMode = !this.id;
    
    // Initialize form
    this.form = this.formBuilder.group({
      employeeId: [{ value: '', disabled: true }],
      userId: ['', Validators.required],
      position: ['', Validators.required],
      departmentId: ['', Validators.required],
      hireDate: [new Date().toISOString().split('T')[0], Validators.required],
      status: ['Active']
    });
    
    // Load users for dropdown
    this.accountService.getAll()
      .subscribe(
        users => {
          // Filter to only show ACTIVE accounts
          this.users = users.filter(user => user.isActive === true);
          console.log('Filtered active users:', this.users.length);
        },
        error => {
          this.alertService.error('Failed to load users');
          console.error(error);
        }
      );
    
    // Load departments for dropdown
    this.departmentService.getAll()
      .subscribe(
        departments => this.departments = departments,
        error => {
          this.alertService.error('Failed to load departments');
          console.error(error);
        }
      );
    
    // Generate employee ID for new employees
    if (this.isAddMode) {
      this.employeeService.getAll()
        .subscribe(employees => {
          let max = 0;
          employees.forEach(emp => {
            const match = emp.employeeId && emp.employeeId.match(/EMP(\d+)/);
            if (match) {
              const num = parseInt(match[1], 10);
              if (num > max) max = num;
            }
          });
          const nextId = 'EMP' + String(max + 1).padStart(3, '0');
          this.form.patchValue({ employeeId: nextId });
        });
    } else {
      // Load existing employee data
      this.loading = true;
      this.employeeService.getById(this.id)
        .subscribe(
          employee => {
            this.form.patchValue({
              employeeId: employee.employeeId || '',
              userId: employee.userId || '',
              position: employee.position || '',
              departmentId: employee.departmentId || '',
              hireDate: employee.hireDate ? new Date(employee.hireDate).toISOString().split('T')[0] : '',
              status: employee.status || 'Active'
            });
            this.loading = false;
          },
          error => {
            this.alertService.error('Failed to load employee');
            this.loading = false;
            console.error(error);
          }
        );
    }
  }

  // Convenience getter for easy access to form fields
  get f() { return this.form.controls; }

  save() {
    this.submitted = true;
    
    // Stop here if form is invalid
    if (this.form.invalid) {
      return;
    }
    
    this.loading = true;
    
    // Get form values including disabled fields
    const formValue = { ...this.form.getRawValue() };
    
    if (this.isAddMode) {
      this.createEmployee(formValue);
    } else {
      this.updateEmployee(formValue);
    }
  }

  private createEmployee(formValue: any) {
    this.employeeService.create(formValue)
      .subscribe(
        data => {
          this.alertService.success('Employee added successfully', { keepAfterRouteChange: true });
          this.router.navigate(['../'], { relativeTo: this.route });
        },
        error => {
          this.alertService.error('Error creating employee');
          this.loading = false;
          console.error(error);
        }
      );
  }

  private updateEmployee(formValue: any) {
    this.employeeService.update(this.id, formValue)
      .subscribe(
        data => {
          this.alertService.success('Employee updated successfully', { keepAfterRouteChange: true });
          this.router.navigate(['../../'], { relativeTo: this.route });
        },
        error => {
          this.alertService.error('Error updating employee');
          this.loading = false;
          console.error(error);
        }
      );
  }

  cancel() {
    // Navigate back to the employees list
    if (this.isAddMode) {
      this.router.navigate(['../'], { relativeTo: this.route });
    } else {
      this.router.navigate(['../../'], { relativeTo: this.route });
    }
  }
}