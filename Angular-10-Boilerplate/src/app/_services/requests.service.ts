import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Request, RequestItem } from '../_models/requests';

@Injectable({ providedIn: 'root' })
export class RequestService {
    private apiUrl = `${environment.apiUrl}/requests`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<Request[]> {
        return this.http.get<Request[]>(this.apiUrl);
    }

    getById(id: string): Observable<Request> {
        return this.http.get<Request>(`${this.apiUrl}/${id}`);
    }

    getByEmployeeId(employeeId: string): Observable<Request[]> {
        return this.http.get<Request[]>(`${this.apiUrl}/employee/${employeeId}`);
    }

    create(request: Request): Observable<Request> {
        return this.http.post<Request>(this.apiUrl, request);
    }

    update(id: string, request: Partial<Request>): Observable<Request> {
        return this.http.put<Request>(`${this.apiUrl}/${id}`, request);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    approve(id: string, comments?: string): Observable<Request> {
        return this.http.put<Request>(`${this.apiUrl}/${id}/approve`, { comments });
    }

    reject(id: string, comments: string): Observable<Request> {
        return this.http.put<Request>(`${this.apiUrl}/${id}/reject`, { comments });
    }

    cancel(id: string): Observable<Request> {
        return this.http.put<Request>(`${this.apiUrl}/${id}/cancel`, {});
    }

    addItem(requestId: string, item: RequestItem): Observable<RequestItem> {
        return this.http.post<RequestItem>(`${this.apiUrl}/${requestId}/items`, item);
    }

    updateItem(requestId: string, itemId: string, item: Partial<RequestItem>): Observable<RequestItem> {
        return this.http.put<RequestItem>(`${this.apiUrl}/${requestId}/items/${itemId}`, item);
    }

    deleteItem(requestId: string, itemId: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${requestId}/items/${itemId}`);
    }
}