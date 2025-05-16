import { Account } from './account';
import { Employee } from './employees';

export class Request {
    id: string;
    title: string;
    description?: string;
    type: 'Leave' | 'Equipment' | 'Training' | 'Reimbursement' | 'Other';
    status: 'Pending' | 'Approved' | 'Rejected' | 'Canceled';
    priority: 'Low' | 'Medium' | 'High';
    submissionDate: Date;
    resolutionDate?: Date;
    employeeId: string;
    reviewerId?: string;
    comments?: string;
    
    // UI state flags (not stored in database)
    isDeleting?: boolean;
    isEditing?: boolean;
    
    // Related objects
    employee?: Employee;
    reviewer?: Account;
    items?: RequestItem[];
}

export class RequestItem {
    id: string;
    name: string;
    description?: string;
    quantity: number;
    unitPrice?: number;
    requestId: string;
}