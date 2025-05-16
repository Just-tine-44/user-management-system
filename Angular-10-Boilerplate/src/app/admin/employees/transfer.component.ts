import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { first } from 'rxjs/operators';

import { EmployeeService } from '../../_services/employees.service';
import { DepartmentService } from '../../_services/departments.service';
import { AlertService } from '../../_services/alert.service';
import { Department } from '../../_models/departments';

@Component({
  templateUrl: 'transfer.component.html',
  styles: [`
    .modal-container {
      position: fixed;
      top: 250px;
      left: 0;
      width: 100%;
      height: 100%;
      display: block;
      z-index: 1050;
      overflow-x: hidden;
      overflow-y: auto;
      outline: 0;
    }
    
    .modal-dialog {
      position: relative;
      margin: 1.75rem auto;
      max-width: 500px;
      animation: slideDown 0.3s;
      pointer-events: auto;
      transform: none;
    }
    
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: -1;
    }
    
    @keyframes slideDown {
      from { transform: translateY(-30px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `]
})
export class TransferComponent implements OnInit, OnDestroy {
  id: string;
  employee: any = null;
  departments: Department[] = [];
  departmentId: string = '';
  loading = false;
  submitted = false;
  
  // Track if component is active to prevent navigation issues
  private isActive = true;
  
  // Handle ESC key to close modal
  @HostListener('document:keydown.escape')
  onEscape() {
    this.cancel();
  }
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private employeeService: EmployeeService,
    private departmentService: DepartmentService,
    private alertService: AlertService
  ) {}
  
  ngOnInit() {
    // Set body to prevent scrolling
    document.body.classList.add('modal-open');
    
    this.id = this.route.snapshot.params['id'];
    
    // Load employee details
    this.employeeService.getById(this.id)
      .pipe(first())
      .subscribe(
        employee => {
          this.employee = employee;
          this.departmentId = employee.departmentId;
        },
        error => {
          this.alertService.error('Could not load employee details');
          console.error(error);
          this.safeCancel();
        }
      );
    
    // Load departments for dropdown
    this.departmentService.getAll()
      .pipe(first())
      .subscribe(
        departments => this.departments = departments,
        error => {
          this.alertService.error('Could not load departments');
          console.error(error);
          this.safeCancel();
        }
      );
  }
  
  ngOnDestroy() {
    // Clean up body classes
    document.body.classList.remove('modal-open');
  }
  
  transfer() {
    this.submitted = true;
    
    // Validate department selection
    if (!this.departmentId) {
      this.alertService.error('Please select a department');
      return;
    }
    
    // Don't transfer if department hasn't changed
    if (this.departmentId === this.employee.departmentId) {
      this.alertService.info('Employee is already in this department');
      return;
    }
    
    this.loading = true;
    
    // Send transfer request
    this.employeeService.transfer(this.id, this.departmentId)
      .pipe(first())
      .subscribe(
        response => {
          this.alertService.success('Employee transferred successfully', { keepAfterRouteChange: true });
          this.safeNavigate(['../../']);
        },
        error => {
          this.alertService.error('Transfer failed');
          this.loading = false;
          console.error(error);
        }
      );
  }
  
  cancel() {
    this.safeCancel();
  }
  
  // Safe cancel with additional checks
  private safeCancel() {
    if (!this.isActive) return;
    this.isActive = false;
    
    // Delay navigation slightly to allow animation and prevent UI issues
    setTimeout(() => {
      this.safeNavigate(['../../']);
    }, 50);
  }
  
  // Safe navigation with guards
  private safeNavigate(commands: any[]) {
    try {
      this.router.navigate(commands, { relativeTo: this.route });
    } catch (err) {
      console.error('Navigation error:', err);
      // Fallback navigation if relative navigation fails
      this.router.navigate(['/admin/employees']);
    }
  }
}