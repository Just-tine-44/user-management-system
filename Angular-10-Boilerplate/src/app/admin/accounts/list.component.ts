import { Component, OnInit } from '@angular/core'; 
import { first } from 'rxjs/operators';

import { AccountService } from '@app/_services'; 
import { Account } from '@app/_models';

@Component({ templateUrl: 'list.component.html' }) 
export class ListComponent implements OnInit { 
    accounts: Account[];

    constructor(private accountService: AccountService) {}

    ngOnInit() {
        this.loadAccountsFromLocalStorage();
        this.fetchAccounts();
    }

    loadAccountsFromLocalStorage() {
        const storedAccounts = localStorage.getItem('accounts');
        if (storedAccounts) {
            this.accounts = JSON.parse(storedAccounts);
        }
    }

    fetchAccounts() {
        this.accountService.getAll()
            .pipe(first())
            .subscribe(accounts => {
                this.accounts = accounts.map(account => {
                    const storedStatus = localStorage.getItem(`account_${account.id}`);
                    account.isActive = storedStatus !== null && storedStatus === 'true'; // Ensure proper boolean conversion
                    return account;
                });
                localStorage.setItem('accounts', JSON.stringify(this.accounts));
            });
    }

    toggleActiveStatus(id: string) {
        const account = this.accounts.find(x => x.id === id);
        if (account && account.role !== 'Admin') {
            account.isActive = !account.isActive;
            
            // Use the updateStatus method instead of update
            this.accountService.updateStatus(id, account.isActive)
                .pipe(first())
                .subscribe({
                    next: () => {
                        console.log(`Account ${id} is now ${account.isActive ? 'active' : 'inactive'}`);
                        localStorage.setItem(`account_${id}`, account.isActive.toString());
                        localStorage.setItem('accounts', JSON.stringify(this.accounts));
                    },
                    error: error => {
                        console.error('Failed to update account status:', error);
                        // Revert the status change in the UI if the API call fails
                        account.isActive = !account.isActive;
                    }
                });
        }
    }
}