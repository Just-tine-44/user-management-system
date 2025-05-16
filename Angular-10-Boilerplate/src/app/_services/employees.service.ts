import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Employee } from '../_models/employees';

const baseUrl = `${environment.apiUrl}/employees`;

@Injectable({ providedIn: 'root' })
export class EmployeeService {
    constructor(private http: HttpClient) { }

    getAll(): Observable<Employee[]> {
        return this.http.get<Employee[]>(baseUrl);
    }

    getById(id: string): Observable<Employee> {
        return this.http.get<Employee>(`${baseUrl}/${id}`);
    }

    // Add this method to fix the error
    getByUserId(userId: string): Observable<Employee> {
        return this.http.get<Employee>(`${baseUrl}/user/${userId}`);
    }

    create(employee: any): Observable<Employee> {
        return this.http.post<Employee>(baseUrl, employee);
    }

    update(id: string, employee: any): Observable<Employee> {
        return this.http.put<Employee>(`${baseUrl}/${id}`, employee);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${baseUrl}/${id}`);
    }

    transfer(id: string, departmentId: string): Observable<any> {
        return this.http.post<any>(`${baseUrl}/${id}/transfer`, { departmentId });
    }
}