import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { first } from 'rxjs/operators';

import { RequestService } from '../../_services/requests.service';
import { AlertService } from '../../_services/alert.service';
import { AccountService } from '../../_services/account.service';
import { Request, RequestItem } from '../../_models/requests';

@Component({
  templateUrl: 'add-edit.component.html'
})
export class AddEditComponent implements OnInit {
  id: string;
  request: any = {
    title: '',
    description: '',
    type: 'Equipment',
    priority: 'Medium',
    items: []
  };
  loading = false;
  submitted = false;
  errorMessage = '';
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private requestService: RequestService,
    private accountService: AccountService,
    private alertService: AlertService
  ) {}
  
  ngOnInit() {
  this.id = this.route.snapshot.params['id'];
    
  // Get employeeId from query parameters
  const queryParams = this.route.snapshot.queryParams;
  if (queryParams && queryParams['employeeId']) {
    this.request.employeeId = queryParams['employeeId'];
    console.log('Using employeeId from query params:', this.request.employeeId);
  }
    
    // If editing an existing request, load its data
    if (this.id) {
      this.loading = true;
      this.requestService.getById(this.id)
        .pipe(first())
        .subscribe(
          request => {
            this.loading = false;
            this.request = request;
            
            // If items is null or undefined, initialize as empty array
            if (!this.request.items) {
              this.request.items = [];
            }
          },
          error => {
            this.loading = false;
            this.errorMessage = 'Could not load request data';
            console.error(error);
            this.alertService.error('Error loading request');
          }
        );
    }
  }
  
  addItem() {
    this.request.items.push({
      name: '',
      description: '',
      quantity: 1,
      unitPrice: null
    });
  }
  
  removeItem(index: number) {
    this.request.items.splice(index, 1);
  }
  
  save() {
    this.submitted = true;
    
    // Validate form
    if (!this.request.type) {
      this.errorMessage = 'Request type is required';
      return;
    }
    
    // Add debug log
    console.log('Saving request with data:', this.request);
    
    // Validate items
    if (this.request.items.length === 0) {
      this.errorMessage = 'At least one item is required';
      return;
    }
    
    // Check that all items have a name
    for (const item of this.request.items) {
      if (!item.name) {
        this.errorMessage = 'All items must have a name';
        return;
      }
      if (!item.quantity || item.quantity <= 0) {
        this.errorMessage = 'All items must have a valid quantity';
        return;
      }
    }
    
    this.loading = true;
    
    if (this.id) {
      // Update existing request
      this.requestService.update(this.id, this.request)
        .pipe(first())
        .subscribe(
          data => {
            this.alertService.success('Request updated', { keepAfterRouteChange: true });
            this.router.navigate(['../../'], { relativeTo: this.route });
          },
          error => {
            this.loading = false;
            this.errorMessage = error || 'Error updating request';
            console.error(error);
            this.alertService.error(this.errorMessage);
          }
        );
    } else {
      // Create new request
      this.requestService.create(this.request)
        .pipe(first())
        .subscribe(
          data => {
            this.alertService.success('Request submitted', { keepAfterRouteChange: true });
            this.router.navigate(['../'], { relativeTo: this.route });
          },
          error => {
            this.loading = false;
            this.errorMessage = error || 'Error submitting request';
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