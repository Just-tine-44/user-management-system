const db = require('_helper/db');
const Role = require('_helper/role');

module.exports = {
    create,
    getAll,
    getById,
    getByEmployeeId,
    update,
    delete: _delete,
    approve,
    reject,
    cancel
};

async function create(userId, params) {
    // Get the employee record for the current user
    const employee = await db.Employee.findOne({ where: { userId } });
    if (!employee) {
        throw new Error('Employee record not found for this user');
    }
    
    // Create the request with items if provided
    const request = await db.Request.create({
        ...params,
        employeeId: employee.id,
        status: 'Pending',
        submissionDate: new Date()
    }, {
        include: [{ model: db.RequestItem }]
    });
    
    return getById(request.id);
}

async function getAll() {
    return await db.Request.findAll({
        include: [
            { 
                model: db.Employee,
                include: [
                    { model: db.User, attributes: ['id', 'firstName', 'lastName', 'email'] },
                    { model: db.Department, attributes: ['id', 'name'] }
                ] 
            },
            { 
                model: db.User, 
                as: 'Reviewer',
                attributes: ['id', 'firstName', 'lastName', 'email']
            },
            { model: db.RequestItem }
        ],
        order: [
            ['submissionDate', 'DESC'],
            [db.RequestItem, 'id', 'ASC']
        ]
    });
}

async function getById(id) {
    const request = await db.Request.findByPk(id, {
        include: [
            { 
                model: db.Employee,
                include: [
                    { model: db.User, attributes: ['id', 'firstName', 'lastName', 'email'] },
                    { model: db.Department, attributes: ['id', 'name'] }
                ] 
            },
            { 
                model: db.User, 
                as: 'Reviewer',
                attributes: ['id', 'firstName', 'lastName', 'email']
            },
            { model: db.RequestItem }
        ]
    });
    
    if (!request) {
        throw new Error('Request not found');
    }
    
    return request;
}

async function getByEmployeeId(employeeId) {
    return await db.Request.findAll({
        where: { employeeId },
        include: [
            { 
                model: db.User, 
                as: 'Reviewer',
                attributes: ['id', 'firstName', 'lastName', 'email']
            },
            { model: db.RequestItem }
        ],
        order: [
            ['submissionDate', 'DESC'],
            [db.RequestItem, 'id', 'ASC']
        ]
    });
}

async function update(id, params, user) {
    const request = await getById(id);
    
    // Only allow updates to pending requests
    if (request.status !== 'Pending' && user.role !== Role.Admin) {
        throw new Error('Cannot modify a request that is no longer pending');
    }
    
    // Only allow employees to update their own requests, unless admin
    if (user.role !== Role.Admin && request.employeeId !== user.employeeId) {
        throw new Error('Unauthorized');
    }
    
    // Update basic request properties
    const allowedUpdates = ['title', 'description', 'type', 'priority'];
    for (const field of allowedUpdates) {
        if (params[field] !== undefined) {
            request[field] = params[field];
        }
    }
    
    // Only admins can update status and reviewer
    if (user.role === Role.Admin) {
        if (params.status) request.status = params.status;
        if (params.reviewerId) request.reviewerId = params.reviewerId;
        if (params.comments) request.comments = params.comments;
    }
    
    await request.save();
    
    // Handle items if provided
    if (params.items) {
        // Delete existing items
        await db.RequestItem.destroy({ where: { requestId: request.id } });
        
        // Create new items
        if (params.items.length > 0) {
            await db.RequestItem.bulkCreate(params.items.map(item => ({
                ...item,
                requestId: request.id
            })));
        }
    }
    
    return getById(id);
}

async function _delete(id, user) {
    const request = await getById(id);
    
    // Only allow employees to delete their own requests, unless admin
    if (user.role !== Role.Admin && request.employeeId !== user.employeeId) {
        throw new Error('Unauthorized');
    }
    
    // Only allow deletion of pending requests for non-admins
    if (user.role !== Role.Admin && request.status !== 'Pending') {
        throw new Error('Cannot delete a request that is no longer pending');
    }
    
    await request.destroy();
}

async function approve(id, reviewerId, comments) {
    const request = await getById(id);
    
    if (request.status !== 'Pending') {
        throw new Error('Only pending requests can be approved');
    }
    
    request.status = 'Approved';
    request.reviewerId = reviewerId;
    request.comments = comments;
    request.resolutionDate = new Date();
    
    await request.save();
    
    return request;
}

async function reject(id, reviewerId, comments) {
    const request = await getById(id);
    
    if (request.status !== 'Pending') {
        throw new Error('Only pending requests can be rejected');
    }
    
    if (!comments) {
        throw new Error('Comments are required when rejecting a request');
    }
    
    request.status = 'Rejected';
    request.reviewerId = reviewerId;
    request.comments = comments;
    request.resolutionDate = new Date();
    
    await request.save();
    
    return request;
}

async function cancel(id, userId) {
    const request = await getById(id);
    const employee = await db.Employee.findOne({ where: { userId } });
    
    if (!employee) {
        throw new Error('Employee record not found');
    }
    
    if (request.employeeId !== employee.id) {
        throw new Error('You can only cancel your own requests');
    }
    
    if (request.status !== 'Pending') {
        throw new Error('Only pending requests can be canceled');
    }
    
    request.status = 'Canceled';
    request.resolutionDate = new Date();
    
    await request.save();
    
    return request;
}