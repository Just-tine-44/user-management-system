import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router'; 
import { first } from 'rxjs/operators';

import { RequestService } from '../../_services/requests.service';
import { AccountService } from '../../_services/account.service';
import { AlertService } from '../../_services/alert.service';
import { Request } from '../../_models/requests';

@Component({
  templateUrl: 'list.component.html'
})
export class ListComponent implements OnInit {
  requests: Request[] = [];
  loading = false;
  employeeId: string;
  
  constructor(
    private requestService: RequestService,
    private accountService: AccountService,
    private alertService: AlertService,
    private router: Router,
    private route: ActivatedRoute
  ) {}
  
  ngOnInit() {
  // Get employeeId from query params
  this.route.queryParams.subscribe(params => {
    this.employeeId = params['employeeId'];
    this.loadRequests();
  });
}
  
  account() {
    return this.accountService.accountValue;
  }
  
loadRequests() {
  this.loading = true;
  
  // If employeeId is provided in the URL, load requests for that employee
  if (this.employeeId) {
    this.requestService.getByEmployeeId(this.employeeId)
      .pipe(first())
      .subscribe(
        requests => {
          this.requests = requests;
          this.loading = false;
          console.log('Loaded requests for employee', this.employeeId, requests);
        },
        error => {
          this.alertService.error('Error loading requests for employee');
          this.loading = false;
          console.error(error);
        }
      );
  }
  // If admin and no employeeId, load all requests
  else if (this.account()?.role === 'Admin') {
    this.requestService.getAll()
      .pipe(first())
      .subscribe(
        requests => {
          this.requests = requests;
          this.loading = false;
          console.log('Loaded all requests', requests);
        },
        error => {
          this.alertService.error('Error loading requests');
          this.loading = false;
          console.error(error);
        }
      );
  } else {
    // Use the current user's ID
    const userId = this.account()?.id;
    if (userId) {
      // Request by user ID
      this.requestService.getAll()
        .pipe(first())
        .subscribe(
          allRequests => {
            this.requests = allRequests.filter(r => r.employee?.userId === userId);
            this.loading = false;
          },
          error => {
            this.alertService.error('Error loading requests');
            this.loading = false;
            console.error(error);
          }
        );
    } else {
      this.loading = false;
      this.alertService.error('No user account found');
    }
  }
}
  
  viewRequest(id: string) {
    this.router.navigate(['/admin/requests', id]);
  }
  
  editRequest(id: string) {
    this.router.navigate(['/admin/requests/edit', id]);
  }
  
  deleteRequest(id: string) {
    const request = this.requests.find(r => r.id === id);
    if (!request) return;
    
    request.isDeleting = true;
    this.requestService.delete(id)
      .pipe(first())
      .subscribe(
        () => {
          this.requests = this.requests.filter(r => r.id !== id);
          this.alertService.success('Request deleted successfully');
        },
        error => {
          this.alertService.error('Error deleting request');
          request.isDeleting = false;
          console.error(error);
        }
      );
  }

  // Add this method if it doesn't exist
  addRequest() {
    // Preserve the employeeId when adding a new request
    const queryParams: any = {};
    if (this.employeeId) {
      queryParams.employeeId = this.employeeId;
    }
    this.router.navigate(['add'], { 
      relativeTo: this.route,
      queryParams: queryParams
    });
  }
  
  // Add this method to fix the error
  add() {
    this.router.navigate(['/admin/requests/add']);
  }
}