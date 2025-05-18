import { Role } from './role';

export class Account {
    id: string;
    email: string;
    title: string;
    firstName: string;
    lastName: string;
    role: string;
    jwtToken?: string; // Make sure this property exists
    created: Date;
    updated: Date;
    isVerified: boolean;
}