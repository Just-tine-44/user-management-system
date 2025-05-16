const db = require('_helper/db');

module.exports = {
    create,
    getAll,
    getById,
    getByEmployeeId,
    updateStatus,
    completeWorkflow,
    cancelWorkflow,
    createOnboarding,
    createOffboarding,
    createTransfer,
    createPromotion
};

async function create(params) {
    // Validate employee exists
    const employee = await db.Employee.findByPk(params.employeeId);
    if (!employee) {
        throw new Error('Employee not found');
    }
    
    // Validate assignee if provided
    if (params.assignedToId) {
        const assignee = await db.Account.findByPk(params.assignedToId);
        if (!assignee) {
            throw new Error('Assigned user not found');
        }
    }
    
    // Create the workflow
    const workflow = await db.Workflow.create({
        ...params,
        status: 'Pending',
        startDate: new Date()
    });
    
    return getById(workflow.id);
}

async function getAll() {
    return await db.Workflow.findAll({
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
        order: [
            ['startDate', 'DESC']
        ]
    });
}

async function getById(id) {
    const workflow = await db.Workflow.findByPk(id, {
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
        ]
    });
    
    if (!workflow) {
        throw new Error('Workflow not found');
    }
    
    return workflow;
}

async function getByEmployeeId(employeeId) {
    // Validate employee exists
    const employee = await db.Employee.findByPk(employeeId);
    if (!employee) {
        throw new Error('Employee not found');
    }
    
    return await db.Workflow.findAll({
        where: { employeeId },
        include: [
            {
                model: db.Account, 
                as: 'AssignedTo',
                attributes: ['id', 'firstName', 'lastName', 'email']
            }
        ],
        order: [['startDate', 'DESC']]
    });
}

async function updateStatus(id, status, userId) {
    const workflow = await getById(id);
    
    // Get the current user role from the database
    const user = await db.Account.findByPk(userId);
    const isAdmin = user && user.role === 'Admin';
    
    // Define valid transitions
    let validTransitions = {
        'Pending': ['InProgress', 'Canceled'],
        'InProgress': ['Completed', 'Canceled'],
        'Completed': [],  // By default, completed status can't be changed
        'Canceled': []    // By default, canceled status can't be changed
    };
    
    // If the user is an admin, allow any status transition
    if (isAdmin) {
        validTransitions = {
            'Pending': ['InProgress', 'Completed', 'Canceled'],
            'InProgress': ['Pending', 'Completed', 'Canceled'],
            'Completed': ['Pending', 'InProgress', 'Canceled'],
            'Canceled': ['Pending', 'InProgress', 'Completed']
        };
    }
    
    // Validate the transition
    if (!validTransitions[workflow.status].includes(status)) {
        throw new Error(`Cannot transition from ${workflow.status} to ${status}`);
    }
    
    workflow.status = status;
    
    // Update completion date if completed or canceled
    if (status === 'Completed' || status === 'Canceled') {
        workflow.completionDate = new Date();
    } else if (workflow.completionDate) {
        // Clear completion date if status is changing back to Pending or InProgress
        workflow.completionDate = null;
    }
    
    await workflow.save();
    
    // Update employee status if this is an offboarding workflow that's completed
    if (status === 'Completed' && workflow.type === 'Offboarding') {
        const employee = await db.Employee.findByPk(workflow.employeeId);
        if (employee) {
            employee.status = 'Inactive';
            await employee.save();
        }
    }
    
    return getById(id);
}

async function completeWorkflow(id) {
    return await updateStatus(id, 'Completed');
}

async function cancelWorkflow(id) {
    return await updateStatus(id, 'Canceled');
}

// Specialized workflow creation functions
async function createOnboarding(employeeId, assignedToId) {
    // Validate employee exists
    const employee = await db.Employee.findByPk(employeeId, {
        include: [{ model: db.Department }]
    });
    
    if (!employee) {
        throw new Error('Employee not found');
    }
    
    // Create onboarding workflow
    const workflow = await db.Workflow.create({
        type: 'Onboarding',
        status: 'Pending',
        startDate: new Date(),
        employeeId,
        assignedToId,
        priority: 'High',
        details: JSON.stringify({
            department: employee.Department?.id,
            departmentName: employee.Department?.name,
            position: employee.position,
            startDate: employee.hireDate
        })
    });
    
    return getById(workflow.id);
}

async function createOffboarding(employeeId, assignedToId, lastWorkingDate, reason) {
    // Validate employee exists and is active
    const employee = await db.Employee.findByPk(employeeId, {
        include: [{ model: db.Department }]
    });
    
    if (!employee) {
        throw new Error('Employee not found');
    }
    
    if (employee.status !== 'Active') {
        throw new Error('Employee is already inactive');
    }
    
    // Create offboarding workflow
    const workflow = await db.Workflow.create({
        type: 'Offboarding',
        status: 'Pending',
        startDate: new Date(),
        employeeId,
        assignedToId,
        priority: 'High',
        details: JSON.stringify({
            department: employee.Department?.id,
            departmentName: employee.Department?.name,
            position: employee.position,
            lastWorkingDate: lastWorkingDate,
            reason: reason || 'Not specified'
        })
    });
    
    return getById(workflow.id);
}

async function createTransfer(employeeId, oldDepartmentId, newDepartmentId, assignedToId, transferDate, reason) {
    // Validate employee exists
    const employee = await db.Employee.findByPk(employeeId);
    
    if (!employee) {
        throw new Error('Employee not found');
    }
    
    // Validate departments exist
    const oldDepartment = await db.Department.findByPk(oldDepartmentId);
    const newDepartment = await db.Department.findByPk(newDepartmentId);
    
    if (!oldDepartment || !newDepartment) {
        throw new Error('One or both departments not found');
    }
    
    // Create transfer workflow
    const workflow = await db.Workflow.create({
        type: 'Transfer',
        status: 'Pending',
        startDate: new Date(),
        employeeId,
        assignedToId,
        priority: 'Medium',
        details: JSON.stringify({
            oldDepartmentId,
            oldDepartmentName: oldDepartment.name,
            newDepartmentId,
            newDepartmentName: newDepartment.name,
            transferDate: transferDate || new Date(),
            reason: reason || 'Department transfer'
        })
    });
    
    return getById(workflow.id);
}

async function createPromotion(employeeId, currentPosition, newPosition, assignedToId, effectiveDate, reason) {
    // Validate employee exists
    const employee = await db.Employee.findByPk(employeeId, {
        include: [{ model: db.Department }]
    });
    
    if (!employee) {
        throw new Error('Employee not found');
    }
    
    // Create promotion workflow
    const workflow = await db.Workflow.create({
        type: 'Promotion',
        status: 'Pending',
        startDate: new Date(),
        employeeId,
        assignedToId,
        priority: 'Medium',
        details: JSON.stringify({
            department: employee.Department?.id,
            departmentName: employee.Department?.name,
            currentPosition: currentPosition || employee.position,
            newPosition,
            effectiveDate: effectiveDate || new Date(),
            reason: reason || 'Performance promotion'
        })
    });
    
    return getById(workflow.id);
}