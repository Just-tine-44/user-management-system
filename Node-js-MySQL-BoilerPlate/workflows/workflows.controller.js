const express = require('express');
const router = express.Router();
const db = require('_helper/db');
const authorize = require('_middleware/authorize');
const Role = require('_helper/role');
const { Op } = require('sequelize');
const workflowService = require('./workflows.service');

// Routes
router.get('/', authorize(), getAll); // Changed to allow all authorized users
router.post('/', authorize(Role.Admin), create);
router.get('/employee/:employeeId', authorize(), getByEmployeeId);
router.get('/:id', authorize(), getById);
router.put('/:id/status', authorize(), updateStatus); // Allow users to update status of their workflows
router.post('/onboarding', authorize(Role.Admin), onboarding);
router.post('/offboarding', authorize(Role.Admin), offboarding);
router.post('/transfer', authorize(Role.Admin), transfer);
router.post('/promotion', authorize(Role.Admin), promotion);

// Controller functions
async function getAll(req, res, next) {
    try {
        const account = req.user;
        let workflows = [];
        
        // Admin can see all workflows
        if (account.role === Role.Admin) {
            workflows = await db.Workflow.findAll({
                include: [
                    { 
                        model: db.Employee,
                        as: 'Employee', 
                        include: [
                            { model: db.Account, as: 'User', attributes: ['id', 'firstName', 'lastName', 'email'] },
                            { model: db.Department, as: 'department', attributes: ['id', 'name'] }
                        ]
                    },
                    { 
                        model: db.Account, 
                        as: 'AssignedTo', 
                        attributes: ['id', 'firstName', 'lastName', 'email'] 
                    }
                ],
                order: [['createdAt', 'DESC']]
            });
        } else {
            // Regular users can only see workflows where:
            // 1. They are the assignee, OR
            // 2. The workflow belongs to their employee record
            
            // First, find the employee ID for this user
            const employee = await db.Employee.findOne({
                where: { userId: account.id }
            });
            
            const employeeId = employee ? employee.id : null;
            
            // Define the where clause
            const whereClause = {
                [Op.or]: [
                    { assignedToId: account.id }
                ]
            };
            
            // Only add employeeId condition if we found an employee record
            if (employeeId) {
                whereClause[Op.or].push({ employeeId: employeeId });
            }
            
            workflows = await db.Workflow.findAll({
                where: whereClause,
                include: [
                    { 
                        model: db.Employee,
                        as: 'Employee',  // Add this missing alias
                        include: [
                            { model: db.Account, as: 'User', attributes: ['id', 'firstName', 'lastName', 'email'] }
                        ]
                    },
                    { 
                        model: db.Account, 
                        as: 'AssignedTo', 
                        attributes: ['id', 'firstName', 'lastName', 'email'] 
                    }
                ],
                order: [['createdAt', 'DESC']]
            });
        }
        
        res.json(workflows);
    } catch (err) { 
        console.error('Error fetching workflows:', err);
        res.status(500).json({ 
            message: err.message || 'Error retrieving workflows',
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
}

async function create(req, res, next) {
    try {
        const workflow = await workflowService.create(req.body);
        res.status(201).json(workflow);
    } catch (err) { 
        console.error('Error creating workflow:', err);
        res.status(500).json({ 
            message: err.message || 'Error creating workflow',
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
}

async function getById(req, res, next) {
    try {
        // Use the service method instead of direct DB access
        const workflow = await workflowService.getById(req.params.id);
        
        if (!workflow) {
            return res.status(404).json({ message: 'Workflow not found' });
        }
        
        // Check permissions - only admin, assignee, or the employee can view it
        const account = req.user;
        if (account.role !== Role.Admin && 
            account.id !== workflow.assignedToId && 
            (!workflow.Employee || account.id !== workflow.Employee.User.id)) {
            return res.status(403).json({ message: 'Forbidden: You do not have permission to access this workflow' });
        }
        
        res.json(workflow);
    } catch (err) { 
        console.error(`Error fetching workflow ${req.params.id}:`, err);
        res.status(500).json({ 
            message: err.message || 'Error retrieving workflow',
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
}

async function getByEmployeeId(req, res, next) {
    try {
        // Check permissions - only admin or the employee themselves can view their workflows
        const account = req.user;
        const employee = await db.Employee.findByPk(req.params.employeeId, {
            include: [{ model: db.Account, as: 'User' }]
        });
        
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        
        if (account.role !== Role.Admin && account.id !== employee.userId) {
            return res.status(403).json({ message: 'Forbidden: You do not have permission to access these workflows' });
        }
        
        // Use the service method instead of direct database queries
        const workflows = await workflowService.getByEmployeeId(req.params.employeeId);
        res.json(workflows);
    } catch (err) { 
        console.error(`Error fetching workflows for employee ${req.params.employeeId}:`, err);
        res.status(500).json({ 
            message: err.message || 'Error retrieving workflows',
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
}

async function updateStatus(req, res, next) {
    try {
        // Find the workflow with proper aliases
        const workflow = await db.Workflow.findByPk(req.params.id, {
            include: [{ 
                model: db.Employee, 
                as: 'Employee',  // Add this missing alias
                include: [
                    { model: db.Account, as: 'User' }
                ]
            }]
        });
        
        if (!workflow) {
            return res.status(404).json({ message: 'Workflow not found' });
        }
        
        // Check permissions - only admin, assignee, or the employee can update it
        const account = req.user;
        const canUpdate = 
            account.role === Role.Admin || 
            account.id === workflow.assignedToId || 
            (workflow.Employee && workflow.Employee.User && account.id === workflow.Employee.User.id);  // Fixed path to user ID
            
        if (!canUpdate) {
            return res.status(403).json({ message: 'Forbidden: You do not have permission to update this workflow' });
        }
        
        // Use the service method for updating the status
        const updatedWorkflow = await workflowService.updateStatus(req.params.id, req.body.status, account.id);
        
        res.json(updatedWorkflow);
    } catch (err) { 
        console.error(`Error updating workflow status for ${req.params.id}:`, err);
        res.status(500).json({ 
            message: err.message || 'Error updating workflow status',
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
}


async function onboarding(req, res, next) {
    try {
        // Use the service to create an onboarding workflow
        const workflow = await workflowService.createOnboarding(
            req.body.employeeId, 
            req.body.assignedToId, 
            req.body.startDate
        );
        
        res.status(201).json(workflow);
    } catch (err) { 
        console.error('Error creating onboarding workflow:', err);
        res.status(500).json({ 
            message: err.message || 'Error creating onboarding workflow',
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
}

async function offboarding(req, res, next) {
    try {
        // Use the service to create an offboarding workflow
        const workflow = await workflowService.createOffboarding(
            req.body.employeeId,
            req.body.assignedToId,
            req.body.lastWorkingDate,
            req.body.reason
        );
        
        res.status(201).json(workflow);
    } catch (err) { 
        console.error('Error creating offboarding workflow:', err);
        res.status(500).json({ 
            message: err.message || 'Error creating offboarding workflow',
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
}

async function transfer(req, res, next) {
    try {
        // Use the service to create a transfer workflow
        const workflow = await workflowService.createTransfer(
            req.body.employeeId,
            req.body.oldDepartmentId,
            req.body.newDepartmentId,
            req.body.assignedToId,
            req.body.transferDate,
            req.body.reason
        );
        
        res.status(201).json(workflow);
    } catch (err) { 
        console.error('Error creating transfer workflow:', err);
        res.status(500).json({ 
            message: err.message || 'Error creating transfer workflow',
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
}

async function promotion(req, res, next) {
    try {
        // Use the service to create a promotion workflow
        const workflow = await workflowService.createPromotion(
            req.body.employeeId,
            req.body.currentPosition,
            req.body.newPosition,
            req.body.assignedToId,
            req.body.effectiveDate,
            req.body.reason
        );
        
        res.status(201).json(workflow);
    } catch (err) { 
        console.error('Error creating promotion workflow:', err);
        res.status(500).json({ 
            message: err.message || 'Error creating promotion workflow',
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
}

module.exports = router;