import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Workflow, WorkflowStep, mapToWorkflows } from '../_models/workflows';

@Injectable({ providedIn: 'root' })
export class WorkflowService {
    private apiUrl = `${environment.apiUrl}/workflows`;

    constructor(private http: HttpClient) {
        // Log the API URLs to help with debugging
        console.log('Workflows API URL:', this.apiUrl);
    }

    /**
     * Get all workflows
     */
    getAll(): Observable<Workflow[]> {
        return this.http.get<any[]>(this.apiUrl)
            .pipe(
                map(data => mapToWorkflows(data)),
                catchError(this.handleError)
            );
    }

    /**
     * Get workflow by ID
     */
    getById(id: string): Observable<Workflow> {
        return this.http.get<any>(`${this.apiUrl}/${id}`)
            .pipe(
                map(data => {
                    const workflows = mapToWorkflows([data]);
                    return workflows[0];
                }),
                catchError(this.handleError)
            );
    }

    /**
     * Get workflows by employee ID
     */
    getByEmployeeId(employeeId: string): Observable<Workflow[]> {
        return this.http.get<any[]>(`${this.apiUrl}/employee/${employeeId}`)
            .pipe(
                map(data => mapToWorkflows(data)),
                catchError(this.handleError)
            );
    }

    /**
     * Create a new workflow
     */
    create(workflow: Workflow): Observable<Workflow> {
        return this.http.post<any>(this.apiUrl, workflow)
            .pipe(
                map(data => {
                    const workflows = mapToWorkflows([data]);
                    return workflows[0];
                }),
                catchError(this.handleError)
            );
    }

    /**
     * Update workflow status
     */
    updateStatus(id: string, status: string): Observable<Workflow> {
        return this.http.put<any>(`${this.apiUrl}/${id}/status`, { status })
            .pipe(
                map(data => {
                    const workflows = mapToWorkflows([data]);
                    return workflows[0];
                }),
                catchError(this.handleError)
            );
    }

    /**
     * Update workflow step
     */
    updateStep(workflowId: string, stepId: string, step: Partial<WorkflowStep>): Observable<Workflow> {
        return this.http.put<any>(`${this.apiUrl}/${workflowId}/steps/${stepId}`, step)
            .pipe(
                map(data => {
                    const workflows = mapToWorkflows([data]);
                    return workflows[0];
                }),
                catchError(this.handleError)
            );
    }

    /**
     * Complete a workflow
     */
    completeWorkflow(id: string): Observable<Workflow> {
        return this.http.put<any>(`${this.apiUrl}/${id}/complete`, {})
            .pipe(
                map(data => {
                    const workflows = mapToWorkflows([data]);
                    return workflows[0];
                }),
                catchError(this.handleError)
            );
    }

    /**
     * Cancel a workflow
     */
    cancelWorkflow(id: string): Observable<Workflow> {
        return this.http.put<any>(`${this.apiUrl}/${id}/cancel`, {})
            .pipe(
                map(data => {
                    const workflows = mapToWorkflows([data]);
                    return workflows[0];
                }),
                catchError(this.handleError)
            );
    }

    /**
     * Create an onboarding workflow
     */
    createOnboarding(employeeId: string, assignedToId: string, details: any = {}): Observable<Workflow> {
        return this.http.post<any>(`${this.apiUrl}/onboarding`, { 
            employeeId, 
            assignedToId,
            ...details
        })
        .pipe(
            map(data => {
                const workflows = mapToWorkflows([data]);
                return workflows[0];
            }),
            catchError(this.handleError)
        );
    }

    /**
     * Create an offboarding workflow
     */
    createOffboarding(employeeId: string, assignedToId: string, lastWorkingDate: string, reason: string = ''): Observable<Workflow> {
        return this.http.post<any>(`${this.apiUrl}/offboarding`, { 
            employeeId, 
            assignedToId, 
            lastWorkingDate,
            reason
        })
        .pipe(
            map(data => {
                const workflows = mapToWorkflows([data]);
                return workflows[0];
            }),
            catchError(this.handleError)
        );
    }

    /**
     * Create a transfer workflow
     */
    createTransfer(employeeId: string, oldDepartmentId: string, newDepartmentId: string, assignedToId: string): Observable<Workflow> {
        return this.http.post<any>(`${this.apiUrl}/transfer`, { 
            employeeId, 
            oldDepartmentId, 
            newDepartmentId, 
            assignedToId 
        })
        .pipe(
            map(data => {
                const workflows = mapToWorkflows([data]);
                return workflows[0];
            }),
            catchError(this.handleError)
        );
    }

    /**
     * Create a promotion workflow
     */
    createPromotion(employeeId: string, oldPosition: string, newPosition: string, assignedToId: string): Observable<Workflow> {
        return this.http.post<any>(`${this.apiUrl}/promotion`, {
            employeeId,
            oldPosition,
            newPosition,
            assignedToId
        })
        .pipe(
            map(data => {
                const workflows = mapToWorkflows([data]);
                return workflows[0];
            }),
            catchError(this.handleError)
        );
    }

    /**
     * Error handler for HTTP requests
     */
    private handleError(error: HttpErrorResponse) {
        console.error('API Error:', error);
        
        let errorMessage = 'An unknown error occurred';
        
        if (error.error instanceof ErrorEvent) {
            // Client-side error
            errorMessage = `Error: ${error.error.message}`;
        } else {
            // Server-side error
            errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
            
            // Try to extract more specific error message from response
            if (error.error && typeof error.error === 'object') {
                if (error.error.message) {
                    errorMessage = error.error.message;
                } else if (error.error.error) {
                    errorMessage = error.error.error;
                }
            }
        }
        
        return throwError(errorMessage);
    }
}