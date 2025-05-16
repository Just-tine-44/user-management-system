import { Account } from './account';
import { Department } from './departments';

export class Employee {
    id: string;
    employeeId: string;
    position: string;
    departmentId: string;
    userId: string;
    hireDate: Date;
    status: 'Active' | 'Inactive';
    
    // Related objects
    user?: Account;
    department?: Department;
    
    // Computed properties can be added if needed in the frontend
    get fullName(): string {
        return this.user ? `${this.user.firstName} ${this.user.lastName}` : '';
    }
}