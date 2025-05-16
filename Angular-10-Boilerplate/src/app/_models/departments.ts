import { Employee } from './employees';

// Also creating a Department model since it's referenced
export class Department {
    id: string;
    name: string;
    description?: string;
    location?: string;
    managerId?: string;
    status: 'Active' | 'Inactive';
    
    // For displaying employee count in UI
    employeeCount?: number;
    
    // Related objects
    manager?: Employee;
}