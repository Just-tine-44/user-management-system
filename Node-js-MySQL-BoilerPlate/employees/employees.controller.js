const express = require('express');
const router = express.Router();
const authorize = require('_middleware/authorize');
const Role = require('_helper/role');
const employeeService = require('./employees.service');

// Routes
router.post('/', authorize(Role.Admin), create);
router.get('/user/:userId', authorize(), getByUserId);
router.get('/', authorize(), getAll);
router.get('/:id', authorize(), getById);
router.put('/:id', authorize(Role.Admin), update);
router.delete('/:id', authorize(Role.Admin), _delete);
router.post('/:id/transfer', authorize(Role.Admin), transfer);
router.get('/available-users', authorize(Role.Admin), getAvailableUsers);

// Route handlers
async function create(req, res, next) {
    try {
        console.log('Creating employee:', req.body);
        const employee = await employeeService.create(req.body);
        res.status(201).json(employee);
    } catch (err) { 
        console.error('Error creating employee:', err);
        next(err); 
    }
}

async function getAll(req, res, next) {
    try {
        console.log('GET /employees request received');
        const employees = await employeeService.getAll();
        console.log(`Found ${employees.length} employees`);
        res.json(employees);
    } catch (err) { 
        console.error('Error fetching employees:', err);
        next(err); 
    }
}

async function getByUserId(req, res, next) {
    try {
        console.log(`GET /employees/user/${req.params.userId} request received`);
        const employee = await employeeService.getByUserId(req.params.userId);
        if (!employee) return res.status(404).json({ message: 'Employee not found for this user' });
        res.json(employee);
    } catch (err) { 
        console.error('Error fetching employee by user ID:', err);
        next(err); 
    }
}

async function getById(req, res, next) {
    try {
        const employee = await employeeService.getById(req.params.id);
        if (!employee) return res.status(404).json({ message: 'Employee not found' });
        res.json(employee);
    } catch (err) { 
        console.error('Error fetching employee by ID:', err);
        next(err); 
    }
}

async function update(req, res, next) {
    try {
        const employee = await employeeService.update(req.params.id, req.body);
        res.json(employee);
    } catch (err) { 
        console.error('Error updating employee:', err);
        next(err); 
    }
}

async function _delete(req, res, next) {
    try {
        await employeeService.delete(req.params.id);
        res.json({ message: 'Employee deleted successfully' });
    } catch (err) { 
        console.error('Error deleting employee:', err);
        next(err); 
    }
}

async function transfer(req, res, next) {
    try {
        const employee = await employeeService.transfer(req.params.id, req.body.departmentId);
        res.json({ 
            message: 'Employee transferred successfully',
            employee: employee
        });
    } catch (err) { 
        console.error('Error transferring employee:', err);
        next(err); 
    }
}

async function getAvailableUsers(req, res, next) {
    try {
        const users = await employeeService.getAvailableUsers();
        res.json(users);
    } catch (err) {
        console.error('Error fetching available users:', err);
        next(err);
    }
}

// Export the router
module.exports = router;