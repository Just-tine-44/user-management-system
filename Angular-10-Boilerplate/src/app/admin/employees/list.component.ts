import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { first } from 'rxjs/operators';

import { EmployeeService } from '../../_services/employees.service';
import { AccountService } from '@app/_services'; 
import { AlertService } from '../../_services/alert.service';

@Component({
  templateUrl: 'list.component.html'
})
export class ListComponent implements OnInit {
  employees: any[] = [];
  loading = false;
  
  constructor(
    private employeeService: EmployeeService,
    private accountService: AccountService,
    private alertService: AlertService,
    private router: Router
  ) {}
  
  ngOnInit() {
    this.loadEmployees();
  }
  
  account() {
    return this.accountService.accountValue;
  }
  
  loadEmployees() {
    this.loading = true;
    this.employeeService.getAll()
      .pipe(first())
      .subscribe(
        employees => {
          this.employees = employees;
          this.loading = false;
        },
        error => {
          this.alertService.error('Error loading employees');
          this.loading = false;
          console.error(error);
        }
      );
  }
  
  add() {
    this.router.navigate(['/admin/employees/add']);
  }
  
  editEmployee(id: string) {
    this.router.navigate(['/admin/employees/edit', id]);
  }
  
deleteEmployee(id: string) {
  const employee = this.employees.find(x => x.id === id);
  if (!employee) return;
  
  employee.isDeleting = true;
  this.employeeService.delete(id)
    .pipe(first())
    .subscribe(
      () => {
        this.employees = this.employees.filter(x => x.id !== id);
        this.alertService.success('Employee deleted successfully');
      },
      error => {
        if (error.includes("associated workflows or requests")) {
          this.alertService.error(
            'Cannot delete this employee because they have associated workflows or requests. ' +
            'Please delete those records first or transfer them to another employee.'
          );
        } else {
          this.alertService.error('Error deleting employee');
        }
        employee.isDeleting = false;
      }
    );
}
  
  transfer(id: string) {
    this.router.navigate(['/admin/employees', id, 'transfer']);
  }
  
  viewRequests(id: string) {
    this.router.navigate(['/admin/requests'], { queryParams: { employeeId: id } });
  }
  
  viewWorkflows(id: string) {
    this.router.navigate(['/admin/workflows'], { queryParams: { employeeId: id } });
  }
}