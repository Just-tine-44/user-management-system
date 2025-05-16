import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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
  
  constructor(
    private requestService: RequestService,
    private accountService: AccountService,
    private alertService: AlertService,
    private router: Router
  ) {}
  
  ngOnInit() {
    this.loadRequests();
  }
  
  account() {
    return this.accountService.accountValue;
  }
  
  loadRequests() {
    this.loading = true;
    
    // If admin, load all requests, otherwise only the current user's requests
    if (this.account()?.role === 'Admin') {
      this.requestService.getAll()
        .pipe(first())
        .subscribe(
          requests => {
            this.requests = requests;
            this.loading = false;
          },
          error => {
            this.alertService.error('Error loading requests');
            this.loading = false;
            console.error(error);
          }
        );
    } else {
      // Use the current user's ID instead since getEmployeeId is not available
      const userId = this.account()?.id;
      if (userId) {
        // Request by user ID instead of employee ID
        this.requestService.getAll()
          .pipe(first())
          .subscribe(
            allRequests => {
              // Filter requests where the employee is associated with the current user
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
  
  // Add this method to fix the error
  add() {
    this.router.navigate(['/admin/requests/add']);
  }
}