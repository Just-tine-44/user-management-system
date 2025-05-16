import { Account } from './account';
import { Employee } from './employees';

export class Workflow {
    id: string;
    type: 'Onboarding' | 'Offboarding' | 'Transfer' | 'Promotion' | 'Training' | 'Other';
    details?: any; // Changed from string to any to support JSON objects
    status: 'Pending' | 'InProgress' | 'Completed' | 'Canceled';
    startDate: Date;
    completionDate?: Date;
    employeeId: string;
    assignedToId?: string;
    priority: 'Low' | 'Medium' | 'High';
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
    
    // Related objects
    Employee?: Employee; 
    AssignedTo?: Account; 
    steps?: WorkflowStep[];
    

    getFormattedDetails(): string {
        if (!this.details) return 'No details';
        if (typeof this.details === 'string') return this.details;
        
        try {
            // If it's an object, return formatted representation
            return Object.entries(this.details)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ');
        } catch (e) {
            return JSON.stringify(this.details);
        }
    }
}

export class WorkflowStep {
    id: string;
    name: string;
    description?: string;
    status: 'Pending' | 'InProgress' | 'Completed' | 'Skipped';
    order: number;
    dueDate?: Date;
    completionDate?: Date;
    workflowId: string;
    assignedToId?: string;
    createdAt?: Date;
    updatedAt?: Date;
    

    assignedTo?: Account;
}


export function isWorkflow(obj: any): obj is Workflow {
    return obj && 
           typeof obj === 'object' && 
           'id' in obj && 
           'type' in obj && 
           'status' in obj;
}


export function mapToWorkflows(data: any[]): Workflow[] {
    if (!data || !Array.isArray(data)) return [];
    
    return data.map(item => {
        const workflow = new Workflow();
        Object.assign(workflow, item);
        

        if (item.startDate) workflow.startDate = new Date(item.startDate);
        if (item.completionDate) workflow.completionDate = new Date(item.completionDate);
        if (item.createdAt) workflow.createdAt = new Date(item.createdAt);
        if (item.updatedAt) workflow.updatedAt = new Date(item.updatedAt);
        

        if (item.steps && Array.isArray(item.steps)) {
            workflow.steps = item.steps.map(step => {
                const workflowStep = new WorkflowStep();
                Object.assign(workflowStep, step);
                

                if (step.dueDate) workflowStep.dueDate = new Date(step.dueDate);
                if (step.completionDate) workflowStep.completionDate = new Date(step.completionDate);
                
                return workflowStep;
            });
        }
        
        return workflow;
    });
}