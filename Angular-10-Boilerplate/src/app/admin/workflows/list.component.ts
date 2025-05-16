import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { first } from 'rxjs/operators';

import { WorkflowService } from '../../_services/workflows.service';
import { EmployeeService } from '../../_services/employees.service';
import { AccountService } from '../../_services/account.service';
import { AlertService } from '../../_services/alert.service';
import { Workflow } from '../../_models/workflows';
import { DepartmentService } from '../../_services/departments.service';

@Component({
  templateUrl: 'list.component.html',
  styles: [`
    .loading-overlay {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 200px;
    }
    .badge {
      font-size: 0.9em;
      padding: 0.5em 0.8em;
    }
    .details-item {
      display: flex;
      margin-bottom: 0.3rem;
    }
    .details-label {
      font-weight: 600;
      min-width: 120px;
      color: #495057;
    }
    .details-value {
      color: #212529;
    }
    .status-badge {
      display: inline-block;
      padding: 0.4em 0.65em;
      font-size: 0.75em;
      font-weight: 500;
      border-radius: 0.375rem;
      text-align: center;
      white-space: nowrap;
      vertical-align: baseline;
    }
  `]
})
export class ListComponent implements OnInit {
  employeeId: string;
  workflows: Workflow[] = [];
  employee: any = null;
  loading = false;
  errorMessage: string = '';
  departmentCache: {[key: string]: string} = {};
  isUserEmployee: boolean = false;
  
  constructor(
    public route: ActivatedRoute,
    public router: Router,
    private workflowService: WorkflowService,
    private employeeService: EmployeeService,
    private accountService: AccountService,
    private alertService: AlertService,
    private departmentService: DepartmentService
  ) {
    console.log('Workflows component initialized');
  }
  
  ngOnInit() {
    console.log('Current route:', this.router.url);
    console.log('Route params:', this.route.snapshot.params);
    console.log('Query params:', this.route.snapshot.queryParams);
    
    // Check if we're viewing a specific workflow detail
    const workflowId = this.route.snapshot.params['id'];
    
    if (workflowId) {
      // If viewing a specific workflow detail, load just that workflow
      this.loading = true;
      console.log(`Loading specific workflow with ID: ${workflowId}`);
      
      this.workflowService.getById(workflowId)
        .pipe(first())
        .subscribe({
          next: workflow => {
            this.workflows = this.parseWorkflowDetails([workflow]);
            
            // Save the employee ID for back navigation if available
            if (workflow.employeeId) {
              this.employeeId = workflow.employeeId;
              // Remember this for back navigation
              sessionStorage.setItem('lastEmployeeId', workflow.employeeId);
              
              // Also try to load employee details
              this.loadEmployee().then(() => {
                this.loading = false;
              });
            } else {
              this.loading = false;
            }
            
            this.preloadDepartmentData(this.workflows);
          },
          error: error => {
            this.setError(`Error loading workflow: ${this.getErrorMessage(error)}`);
            this.loading = false;
          }
        });
      return;
    }
    
    // Otherwise, check for employee ID in both params and query params
    this.employeeId = this.route.snapshot.params['employeeId'] || 
                      this.route.snapshot.queryParams['employeeId'];
    
    if (this.employeeId) {
      console.log(`Loading workflows for employee: ${this.employeeId}`);
      
      // First check permissions - only admin or the employee themselves can view employee workflows
      this.loadEmployee().then(() => {
        if (this.employee) {
          const currentUserId = this.account()?.id;
          const isAdmin = this.account()?.role === 'Admin';
          
          // Check if the current user is the employee or an admin
          if (isAdmin || (this.employee?.User?.id === currentUserId)) {
            this.isUserEmployee = (this.employee?.User?.id === currentUserId);
            this.loadWorkflows();
          } else {
            // Not authorized to view this employee's workflows
            this.alertService.error("You don't have permission to view these workflows");
            this.router.navigate(['/home']);
          }
        }
      });
    } else {
      // If no employee ID is provided, redirect admin to employees list
      // or load current user's workflows for non-admins
      const isAdmin = this.account()?.role === 'Admin';
      if (isAdmin) {
        // Redirect admin to employees list instead of showing all workflows
        console.log("Admin with no employee ID - redirecting to employees list");
        this.router.navigate(['/admin/employees']);
      } else {
        // For non-admins, load their own workflows
        console.log("Regular user with no employee ID - loading their workflows");
        this.loadUserWorkflows();
      }
    }
  }
  
  account() {
    return this.accountService.accountValue;
  }
  
  // Load employee and return a promise for easier chaining
  loadEmployee(): Promise<void> {
    this.loading = true;
    return new Promise<void>((resolve) => {
      this.employeeService.getById(this.employeeId)
        .pipe(first())
        .subscribe({
          next: employee => {
            this.employee = employee;
            this.loading = false;
            resolve();
          },
          error: error => {
            this.setError(`Error loading employee details: ${this.getErrorMessage(error)}`);
            this.loading = false;
            resolve();
          }
        });
    });
  }
  
  // Load workflows for a specific employee (used when employeeId is provided)
  loadWorkflows() {
    this.loading = true;
    this.errorMessage = '';
    
    this.workflowService.getByEmployeeId(this.employeeId)
      .pipe(first())
      .subscribe({
        next: workflows => {
          this.workflows = this.parseWorkflowDetails(workflows);
          this.loading = false;
          console.log(`Loaded ${workflows.length} workflows for employee ${this.employeeId}`);
          // Pre-load department data
          this.preloadDepartmentData(workflows);
        },
        error: error => {
          this.setError(`Error loading workflows: ${this.getErrorMessage(error)}`);
          this.loading = false;
        }
      });
  }
  
  // Load current user's workflows
  loadUserWorkflows() {
    this.loading = true;
    this.errorMessage = '';
    
    // For non-admins, get their employee record first
    const userId = this.account()?.id;
    if (userId) {
      this.employeeService.getByUserId(userId)
        .pipe(first())
        .subscribe({
          next: employee => {
            if (employee) {
              this.employeeId = employee.id;
              this.employee = employee;
              this.isUserEmployee = true;
              this.loadWorkflows();
            } else {
              // User has no employee record, just show workflows assigned to them
              this.loadAssignedWorkflows();
            }
          },
          error: error => {
            this.setError(`Error getting employee information: ${this.getErrorMessage(error)}`);
            this.loading = false;
            // Still try to load assigned workflows
            this.loadAssignedWorkflows();
          }
        });
    } else {
      this.setError('Not logged in');
      this.loading = false;
    }
  }
  
// Replace the loadAssignedWorkflows method with this:
loadAssignedWorkflows() {
  this.loading = true;
  this.errorMessage = '';
  
  const currentUserId = this.account()?.id;
  if (!currentUserId) {
    this.setError('User ID not available');
    this.loading = false;
    return;
  }
  
  // Use the getAll method instead and filter client-side
  this.workflowService.getAll()
    .pipe(first())
    .subscribe({
      next: workflows => {
        // Filter workflows where current user is the assignee
        const assignedWorkflows = workflows.filter(
          workflow => workflow.assignedToId === currentUserId
        );
        
        this.workflows = this.parseWorkflowDetails(assignedWorkflows);
        this.loading = false;
        console.log(`Loaded ${assignedWorkflows.length} workflows assigned to current user`);
        // Pre-load department data
        this.preloadDepartmentData(this.workflows);
      },
      error: error => {
        this.setError(`Error loading workflows: ${this.getErrorMessage(error)}`);
        this.loading = false;
      }
    });
}
  
  // Parse workflow details from JSON strings to objects if needed
  parseWorkflowDetails(workflows: Workflow[]): Workflow[] {
    return workflows.map(workflow => {
      // Parse details if it's a string
      if (workflow.details && typeof workflow.details === 'string') {
        try {
          workflow.details = JSON.parse(workflow.details);
        } catch (e) {
          console.warn(`Could not parse details for workflow ${workflow.id}:`, e);
        }
      }
      return workflow;
    });
  }
  
  preloadDepartmentData(workflows: Workflow[]) {
    // Find all unique department IDs in the workflow details
    const departmentIds = new Set<string>();
    
    workflows.forEach(workflow => {
      if (workflow.details && typeof workflow.details === 'object') {
        // Check for department IDs in different possible fields
        const possibleFields = ['departmentId', 'department', 'oldDepartmentId', 'newDepartmentId'];
        possibleFields.forEach(field => {
          if (workflow.details[field] && !this.departmentCache[workflow.details[field]]) {
            departmentIds.add(workflow.details[field].toString());
          }
        });
      }
    });
    
    // Load department names
    departmentIds.forEach(id => {
      this.getDepartmentName(id);
    });
  }
  
  updateStatus(workflow: Workflow) {
    if (!workflow || !workflow.id) return;
    
    // Check if user has permission to update this workflow
    const currentUserId = this.account()?.id;
    const isAdmin = this.account()?.role === 'Admin';
    
    // Check permissions - admins or assignees only
    if (!isAdmin && workflow.assignedToId !== currentUserId) {
      this.alertService.error('You do not have permission to update this workflow');
      return;
    }
    
    this.loading = true;
    this.workflowService.updateStatus(workflow.id, workflow.status)
      .pipe(first())
      .subscribe({
        next: updatedWorkflow => {
          this.alertService.success('Workflow status updated');
          this.loading = false;
          // Update local object with returned data
          const index = this.workflows.findIndex(w => w.id === workflow.id);
          if (index >= 0) {
            // Parse details if needed
            if (updatedWorkflow.details && typeof updatedWorkflow.details === 'string') {
              try {
                updatedWorkflow.details = JSON.parse(updatedWorkflow.details);
              } catch (e) {
                console.warn(`Could not parse details for updated workflow:`, e);
              }
            }
            this.workflows[index] = updatedWorkflow;
          }
        },
        error: error => {
          this.setError(`Error updating workflow status: ${this.getErrorMessage(error)}`);
          this.loading = false;
          // Reset to previous status on error
          this.refreshWorkflows();
        }
      });
  }
  
  refreshWorkflows() {
    // Check if we're on a workflow detail page
    const workflowId = this.route.snapshot.params['id'];
    
    if (workflowId) {
      // Refresh the specific workflow
      this.workflowService.getById(workflowId)
        .pipe(first())
        .subscribe({
          next: workflow => {
            this.workflows = this.parseWorkflowDetails([workflow]);
            this.loading = false;
            
            // Refresh employee data if available
            if (workflow.employeeId && workflow.employeeId !== this.employeeId) {
              this.employeeId = workflow.employeeId;
              this.loadEmployee();
            }
            
            this.preloadDepartmentData(this.workflows);
          },
          error: error => {
            this.setError(`Error loading workflow: ${this.getErrorMessage(error)}`);
            this.loading = false;
          }
        });
    } else if (this.employeeId) {
      // If we have an employee ID, load that employee's workflows
      this.loadWorkflows();
    } else {
      // If no employee ID, check role
      if (this.account()?.role === 'Admin') {
        // Redirect admin to employees list
        this.router.navigate(['/admin/employees']);
      } else {
        // Load regular user's workflows
        this.loadUserWorkflows();
      }
    }
  }
  
  getStatusClass(status: string): string {
    switch (status) {
      case 'Completed': return 'badge bg-success';
      case 'Canceled': return 'badge bg-danger';
      case 'InProgress': return 'badge bg-primary';
      case 'Pending': return 'badge bg-warning';
      default: return 'badge bg-secondary';
    }
  }
  
  getWorkflowTypeClass(type: string): string {
    switch (type) {
      case 'Onboarding': return 'badge bg-success';
      case 'Offboarding': return 'badge bg-danger';
      case 'Transfer': return 'badge bg-primary';
      case 'Promotion': return 'badge bg-info';
      case 'Training': return 'badge bg-warning';
      default: return 'badge bg-secondary';
    }
  }
  
  viewDetails(workflow: Workflow) {
    console.log('Viewing workflow details:', workflow.id);
    
    // If this workflow has an employee ID, remember it for navigation back
    if (workflow.employeeId) {
      sessionStorage.setItem('lastEmployeeId', workflow.employeeId);
    }
    
    // Navigate to the view route
    this.router.navigate(['/admin/workflows/view', workflow.id]);
  }
  
  goBackToEmployeeWorkflows() {
    console.log('Going back to employee workflows');
    
    // Check if we're viewing a specific workflow
    const workflowId = this.route.snapshot.params['id'];
    
    if (workflowId) {
      // Try to get the employee ID from either the current workflow or session storage
      let employeeId = this.employeeId;
      
      if (!employeeId) {
        employeeId = sessionStorage.getItem('lastEmployeeId');
      }
      
      if (employeeId) {
        console.log(`Navigating back to employee ${employeeId} workflows`);
        this.router.navigate(['/admin/workflows/employee', employeeId]);
      } else {
        // If no employee ID is available, go to default destination
        if (this.account()?.role === 'Admin') {
          this.router.navigate(['/admin/employees']);
        } else {
          this.router.navigate(['/home']);
        }
      }
    } else {
      // If not viewing a specific workflow, go back to appropriate page
      if (this.account()?.role === 'Admin') {
        this.router.navigate(['/admin/employees']);
      } else {
        this.router.navigate(['/home']);
      }
    }
  }
  
  // Helper methods for template
  objectKeys(obj: any): string[] {
    if (!obj) return [];
    return Object.keys(obj);
  }
  
  typeOf(val: any): string {
    return typeof val;
  }
  
  // Format label from camelCase to Title Case with spaces
  formatLabel(key: string): string {
    if (!key) return '';
    
    // Convert camelCase or snake_case to Title Case
    return key
      // Insert space before uppercase letters
      .replace(/([A-Z])/g, ' $1')
      // Replace underscores with spaces
      .replace(/_/g, ' ')
      // Capitalize first letter
      .replace(/^./, str => str.toUpperCase())
      // Remove any extra spaces
      .trim();
  }
  
  // Format date string to readable format
  formatDate(dateString: string): string {
  if (!dateString) return 'Not specified';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString; // If invalid date, return the original string
    }
    
    // Create options for formatting with Philippine locale and timezone
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'Asia/Manila' // Philippine timezone (UTC+8)
    };
    
    // Format the date using Philippine locale
    return new Intl.DateTimeFormat('en-PH', options).format(date);
  } catch (e) {
    console.error('Error formatting date:', e);
    return dateString; // Return original if parsing fails
  }
}
  
  // Get department name from ID with caching
  getDepartmentName(departmentId: any): string {
    if (departmentId === undefined || departmentId === null) return 'None';
    
    const idStr = departmentId.toString();
    
    // Check cache first
    if (this.departmentCache[idStr]) {
      return this.departmentCache[idStr];
    }
    
    // Default display while loading
    this.departmentCache[idStr] = `Department ${idStr}`;
    
    // Load in background
    this.departmentService.getById(idStr)
      .pipe(first())
      .subscribe({
        next: dept => {
          if (dept?.name) {
            this.departmentCache[idStr] = dept.name;
            // Force change detection
            this.workflows = [...this.workflows];
          }
        },
        error: err => {
          console.error(`Could not load department name for ID ${idStr}:`, err);
        }
      });
    
    return this.departmentCache[idStr];
  }
  
  canNavigateToEmployees(): boolean {
    return this.account()?.role === 'Admin';
  }
  
  // Helper to check if we're in view mode
  isViewMode(): boolean {
    return !!this.route.snapshot.params['id'];
  }
  
  // Better error handling
  private setError(message: string) {
    this.errorMessage = message;
    this.alertService.error(message);
    console.error(message);
  }
  
  private getErrorMessage(error: any): string {
    if (typeof error === 'string') return error;
    if (error.message) return error.message;
    if (error.error?.message) return error.error.message;
    if (error.statusText) return error.statusText;
    return 'Unknown error occurred';
  }
}