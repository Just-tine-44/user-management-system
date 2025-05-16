import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Department } from '../_models/departments';

@Injectable({ providedIn: 'root' })
export class DepartmentService {
    private apiUrl = `${environment.apiUrl}/departments`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<Department[]> {
        return this.http.get<Department[]>(this.apiUrl);
    }

    getById(id: string): Observable<Department> {
        return this.http.get<Department>(`${this.apiUrl}/${id}`);
    }

    create(department: Department): Observable<Department> {
        return this.http.post<Department>(this.apiUrl, department);
    }

    update(id: string, department: Department): Observable<Department> {
        return this.http.put<Department>(`${this.apiUrl}/${id}`, department);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    setManager(id: string, managerId: string): Observable<Department> {
        return this.http.post<Department>(`${this.apiUrl}/${id}/manager`, { managerId });
    }

    getEmployees(id: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/${id}/employees`);
    }
}