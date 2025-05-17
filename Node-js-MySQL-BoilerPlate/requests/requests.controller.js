const express = require('express');
const router = express.Router();
const db = require('_helper/db');
const authorize = require('_middleware/authorize');
const Role = require('_helper/role');

// Reordered routes - specific routes before generic ones
router.post('/', authorize(), create);
router.get('/employee/:employeeId', authorize(), getByEmployeeId);
router.get('/', authorize(Role.Admin), getAll);
router.get('/:id', authorize(), getById);
router.put('/:id', authorize(), update);
router.delete('/:id', authorize(Role.Admin), _delete);

async function create(req, res, next) {
    try {
        console.log('Creating request:', req.body);
        
        // Find the employee ID for the current user if not already available
        let employeeId = req.user.employeeId;
        if (!employeeId) {
            const employee = await db.Employee.findOne({
                where: { userId: req.user.id }
            });
            
            if (!employee) {
                return res.status(400).json({ 
                    message: 'Cannot create request: No employee record found for current user' 
                });
            }
            
            employeeId = employee.id;
        }
        
        // First create the request
        const request = await db.Request.create({
            ...req.body,
            employeeId: employeeId,
            submissionDate: new Date()
        });
        
        // Then create request items if any
        if (req.body.items && req.body.items.length > 0) {
            const items = req.body.items.map(item => ({
                ...item,
                requestId: request.id
            }));
            await db.RequestItem.bulkCreate(items);
        }
        
        // Fetch the created request with its items
        const createdRequest = await db.Request.findByPk(request.id, {
            include: [
                { model: db.RequestItem, as: 'items' },
                { model: db.Employee, include: [
                    { model: db.Account, as: 'User', attributes: ['id', 'firstName', 'lastName', 'email'] }
                ]}
            ]
        });
        
        res.status(201).json(createdRequest);
    } catch (err) { 
        console.error('Error creating request:', err);
        next(err); 
    }
}

async function getAll(req, res, next) {
    try {
        console.log('Getting all requests');
        const requests = await db.Request.findAll({
            include: [
                { model: db.RequestItem, as: 'items' },
                { 
                    model: db.Employee,
                    include: [
                        { model: db.Account, as: 'User', attributes: ['id', 'firstName', 'lastName', 'email'] }
                    ]
                },
                { 
                    model: db.Account, 
                    as: 'Reviewer', 
                    attributes: ['id', 'firstName', 'lastName', 'email'] 
                }
            ],
            order: [['submissionDate', 'DESC']]
        });
        console.log(`Found ${requests.length} requests`);
        res.json(requests);
    } catch (err) { 
        console.error('Error fetching all requests:', err);
        next(err); 
    }
}

async function getById(req, res, next) {
    try {
        console.log(`Getting request by ID: ${req.params.id}`);
        const request = await db.Request.findByPk(req.params.id, {
            include: [
                { model: db.RequestItem, as: 'items' },
                { 
                    model: db.Employee,
                    include: [
                        { model: db.Account, as: 'User', attributes: ['id', 'firstName', 'lastName', 'email'] }
                    ]
                },
                { 
                    model: db.Account, 
                    as: 'Reviewer', 
                    attributes: ['id', 'firstName', 'lastName', 'email'] 
                }
            ]
        });
        
        if (!request) {
            console.log(`Request not found: ${req.params.id}`);
            return res.status(404).json({ message: 'Request not found' });
        }
        
        // Only admin or the employee who submitted the request can view it
        if (req.user.role !== Role.Admin && request.employeeId !== req.user.employeeId) {
            console.log(`Unauthorized access attempt by user ${req.user.id} for request ${req.params.id}`);
            return res.status(403).json({ message: 'Unauthorized' });
        }
        
        res.json(request);
    } catch (err) { 
        console.error(`Error fetching request by ID ${req.params.id}:`, err);
        next(err); 
    }
}

async function getByEmployeeId(req, res, next) {
    try {
        console.log(`Getting requests for employee: ${req.params.employeeId}`);
        
        // Only admin or the employee themselves can view their requests
        if (req.user.role !== Role.Admin && req.user.employeeId != req.params.employeeId) {
            console.log(`Unauthorized access attempt by user ${req.user.id} for employee ${req.params.employeeId}`);
            return res.status(403).json({ message: 'Unauthorized' });
        }
        
        const requests = await db.Request.findAll({
            where: { employeeId: req.params.employeeId },
            include: [
                { model: db.RequestItem, as: 'items' },
                { 
                    model: db.Account, 
                    as: 'Reviewer', 
                    attributes: ['id', 'firstName', 'lastName', 'email'] 
                }
            ],
            order: [['submissionDate', 'DESC']]
        });
        
        console.log(`Found ${requests.length} requests for employee ${req.params.employeeId}`);
        res.json(requests);
    } catch (err) { 
        console.error(`Error fetching requests for employee ${req.params.employeeId}:`, err);
        next(err); 
    }
}

async function update(req, res, next) {
    try {
        console.log(`Updating request: ${req.params.id}`, req.body);
        const request = await db.Request.findByPk(req.params.id);
        
        if (!request) {
            console.log(`Request not found: ${req.params.id}`);
            return res.status(404).json({ message: 'Request not found' });
        }
        
        // Find the employee ID for the current user if not already available
        let employeeId = req.user.employeeId;
        if (!employeeId) {
            const employee = await db.Employee.findOne({
                where: { userId: req.user.id }
            });
            
            if (employee) {
                employeeId = employee.id;
            }
        }
        
        // Only admin or the employee who submitted the request can update it
        // For non-admins, can only update their own requests when status is still Pending
        if (req.user.role !== Role.Admin) {
            if (request.employeeId !== employeeId) {
                console.log(`Unauthorized update attempt by user ${req.user.id} for request ${req.params.id}`);
                return res.status(403).json({ message: 'Unauthorized' });
            }
            
            if (request.status !== 'Pending') {
                console.log(`Cannot update request ${req.params.id} with status ${request.status}`);
                return res.status(400).json({ message: 'Cannot update request that is not in Pending status' });
            }
            
            // Non-admins can only update certain fields
            const allowedFields = ['title', 'description', 'priority'];
            const filteredBody = Object.keys(req.body)
                .filter(key => allowedFields.includes(key))
                .reduce((obj, key) => {
                    obj[key] = req.body[key];
                    return obj;
                }, {});
                
            await request.update(filteredBody);
        } else {
            // Admin update
            const updateData = { ...req.body };
            
            // If status is changed to Approved or Rejected, set resolution date and reviewer
            if ((updateData.status === 'Approved' || updateData.status === 'Rejected') && 
                request.status === 'Pending') {
                updateData.resolutionDate = new Date();
                updateData.reviewerId = req.user.id;
            }
            
            await request.update(updateData);
        }
        
        // Handle items update if provided
        if (req.body.items) {
            // Delete existing items
            await db.RequestItem.destroy({ where: { requestId: request.id } });
            
            // Create new items
            if (req.body.items.length > 0) {
                const items = req.body.items.map(item => ({
                    ...item,
                    requestId: request.id
                }));
                await db.RequestItem.bulkCreate(items);
            }
        }
        
        // Fetch the updated request with its items
        const updatedRequest = await db.Request.findByPk(request.id, {
            include: [
                { model: db.RequestItem, as: 'items' },
                { 
                    model: db.Employee,
                    include: [
                        { model: db.Account, as: 'User', attributes: ['id', 'firstName', 'lastName', 'email'] }
                    ]
                },
                { 
                    model: db.Account, 
                    as: 'Reviewer', 
                    attributes: ['id', 'firstName', 'lastName', 'email'] 
                }
            ]
        });
        
        res.json(updatedRequest);
    } catch (err) { 
        console.error(`Error updating request ${req.params.id}:`, err);
        next(err); 
    }
}

async function _delete(req, res, next) {
    try {
        console.log(`Deleting request: ${req.params.id}`);
        const request = await db.Request.findByPk(req.params.id);
        
        if (!request) {
            console.log(`Request not found: ${req.params.id}`);
            return res.status(404).json({ message: 'Request not found' });
        }
        
        // Delete the request (associated items will be deleted via CASCADE)
        await request.destroy();
        
        res.json({ message: 'Request deleted successfully' });
    } catch (err) { 
        console.error(`Error deleting request ${req.params.id}:`, err);
        next(err); 
    }
}

module.exports = router;