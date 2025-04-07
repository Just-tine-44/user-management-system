# User Management System

1. Introduction
The User Management System is a robust, full-stack application designed to handle comprehensive user account management. Built with Angular for the frontend and supported by a customizable backend, it provides essential features including user registration with email verification, secure authentication using JWT tokens, role-based access control, and complete CRUD operations for user management.

---
### **Features**
- User Registration & Verification: Secure signup process with email verification
- Authentication: JWT-based authentication with refresh token support
- Role-Based Authorization: Different access levels for users and administrators
- Account Management: Self-service profile management for users
- Admin Dashboard: Comprehensive tools for administrators to manage all accounts
- Password Recovery: Forgot password and secure reset functionality

---
2. ### **Installation**
• Node.js (v14 or later)
• Angular CLI (v10 or later)
• Git

---
### **Setup Steps**
1. **Clone the repository:**
git clone https://github.com/Just-tine-44/user-management-system.git
cd user-management-system 

2. **Install dependencies:**
npm install

3. **Start the Angular application:**
ng serve

4. **Check:**
Access the application at http://localhost:4200

---
### **Backend Options**
- The system comes with a fake backend for development and testing. For production:

- Configure the API URL in the environment files
- Implement a real backend service using Node.js and MySQL (see /API-Backend folder for setup)


---
3. ### **Usage**
User Operations

### **Registration**
1. Navigate to /account/register
2. Complete the registration form with required details
3. Submit the form to receive a verification email
4. Click the verification link in the email to activate your account

### **Login**
1. Navigate to /account/login
2. Enter your verified email and password
3. You'll be redirected to your user dashboard upon successful authentication

### **Profile Management**
1. Access your profile via the user menu
2. Update personal information, email, or password
3. Changes are saved immediately after submission

### **Password Recovery**
1. On the login page, click "Forgot Password?"
2. Enter your registered email to receive a reset link
3. Follow the link to set a new password

### **Admin Operations**
- Accessing Admin Dashboard
1. Login with admin credentials
2. You'll automatically be directed to the admin dashboard


### **Managing Users**
- The admin dashboard provides capabilities to:
- View all registered users
- Add new users
- Edit user details including roles
- Delete user accounts
- Reset user passwords


---
4. ### **Testing:**
1. Tester Functional Testing: 
Functional testing verifies that the application behaves according to its specifications and meets user requirements. As Tester 1, I conducted comprehensive testing of all core user flows and system functionality to ensure the User Management System performs as expected.

- Link: https://docs.google.com/document/d/1py8yXO7MQAyqBwc9H5Sps5yMLua4tqZC8I3yo8FXwL0/edit?usp=sharing 


---
### **Contributing**
Git Workflow

1. **Create a feature branch from main:**
git checkout -b feature/feature-name

2. **Make changes and commit frequently with descriptive messages:**
git commit -m "Add specific feature implementation"

3. **git push origin feature/feature-name:**
git push origin feature/feature-name

4. **Check:**
Create a Pull Request on GitHub for review and merge

6. **License**
This project is licensed under the MIT License - see the LICENSE file for details.
License
MIT License


---
### **Best Practices**
1. **Commit Often:** Make small, frequent commits with clear messages to track progress.
2. **Use Descriptive Branch Names:** Name branches based on their purpose.
3. **Review Code Before Merging:** Always review pull requests to ensure code quality.
4. **Keep Branches Updated:** Regularly pull changes from `main` to avoid large conflicts.
5. **Communicate with Your Team:** Use GitHub issues or comments to discuss tasks and updates.
---
### **Deliverables**
1. A fully functional **Node.js + MySQL - Boilerplate APILinks to an external site.** backend with:
- Email sign-up and verification.
- JWT authentication with refresh tokens.
- Role-based authorization.
- Forgot password and reset password functionality.
- CRUD operations for managing accounts.
2. A fully functional **Angular 10 (17 updated) BoilerplateLinks to an external site.** frontend with:
- Email sign-up and verification.
- JWT authentication with refresh tokens.
- Role-based authorization.
- Profile management.
- Admin dashboard for managing accounts.
- **Fake backend** implementation for backend-less development.
3. A clean and well-maintained GitHub repository with:
- Proper branching structure.
- Reviewed and merged pull requests.
- Resolved merge conflicts.
4. Comprehensive **README.md documentation** covering installation, usage, testing, and contributing guidelines.
5. Test reports from **testers** ensuring the application is functional and secure.
---
### **Evaluation Criteria**
Each team member will be evaluated individually based on:
1. **Code Quality:** Clean, modular, and well-documented code.
2. **Functionality:** Correct implementation of assigned features.
3. **Collaboration:** Effective use of Git and GitHub for collaboration.
4. **Problem-Solving:** Ability to resolve merge conflicts and debug issues.
5. **Testing:** Thoroughness of testing and quality of test reports.
---

### **Technologies Used**
- Frontend: Angular 10/17, Bootstrap, RxJS
- Backend Options:
 -  Fake backend (included)
 - Node.js + MySQL (configurable)
- Authentication: JWT tokens with refresh mechanism
- Deployment Options: Any static web host or containerized environment