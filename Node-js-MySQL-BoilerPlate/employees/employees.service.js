const db = require('_helper/db');

module.exports = {
    create,
    getAll,
    getById,
    update,
    delete: _delete,
    transfer,
    getByUserId,
    getAvailableUsers
};

async function create(params) {
    // Validate if user exists
    const user = await db.Account.findByPk(params.userId);
    if (!user) throw new Error('User not found');
    
    // Validate if department exists
    const department = await db.Department.findByPk(params.departmentId);
    if (!department) throw new Error('Department not found');
    
    // Check if user already has an employee record
    const existingEmployee = await db.Employee.findOne({ where: { userId: params.userId } });
    if (existingEmployee) throw new Error('This user already has an employee record');
    
    // Create employee
    const employee = await db.Employee.create(params);
    
    return employee;
}

// In employees.service.js, add logging:
async function getAll() {
    console.log('Employee Service: getAll called');
    try {
        const employees = await db.Employee.findAll({
            include: [
                { model: db.Account, as: 'User', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: db.Department, as: 'department', attributes: ['id', 'name'] }
            ]
        });
        console.log('Employee Service: Found', employees.length, 'employees');
        return employees;
    } catch (error) {
        console.error('Employee Service ERROR:', error.message);
        throw error;
    }
}

async function getById(id) {
    const employee = await db.Employee.findByPk(id, {
        include: [
            { model: db.Account, as: 'User', attributes: ['id', 'firstName', 'lastName', 'email'] },
            { model: db.Department, as: 'department', attributes: ['id', 'name'] }
        ]
    });
    
    if (!employee) throw new Error('Employee not found');
    return employee;
}

async function getByUserId(userId) {
    const employee = await db.Employee.findOne({
        where: { userId },
        include: [
            { model: db.Account, as: 'User', attributes: ['id', 'firstName', 'lastName', 'email'] },
            { model: db.Department, as: 'department', attributes: ['id', 'name'] }
        ]
    });
    
    if (!employee) return null;
    return employee;
}


async function update(id, params) {
    const employee = await getById(id);
    

    if (params.departmentId && params.departmentId !== employee.departmentId) {
        const department = await db.Department.findByPk(params.departmentId);
        if (!department) throw new Error('Department not found');
    }
    
    // Copy params properties to employee
    Object.assign(employee, params);
    await employee.save();
    
    return employee;
}

async function _delete(id) {
    const employee = await getById(id);
    
    // Check for related records
    const workflows = await db.Workflow.count({ where: { employeeId: id } });
    const requests = await db.Request.count({ where: { employeeId: id } });
    
    if (workflows > 0 || requests > 0) {
        throw new Error('Cannot delete employee with associated workflows or requests');
    }
    
    await employee.destroy();
}

async function transfer(id, departmentId) {
    const employee = await getById(id);
    
    // Validate new department
    const department = await db.Department.findByPk(departmentId);
    if (!department) throw new Error('Department not found');
    
    // Don't process if it's the same department
    if (employee.departmentId === departmentId) {
        throw new Error('Employee is already in this department');
    }
    
    // Update employee department
    const oldDepartmentId = employee.departmentId;
    employee.departmentId = departmentId;
    await employee.save();
    
    // Create transfer workflow
    await db.Workflow.create({
        employeeId: id,
        type: 'Transfer',
        details: JSON.stringify({
            oldDepartmentId,
            newDepartmentId: departmentId,
            transferDate: new Date()
        }),
        status: 'InProgress'
    });
    
    return employee;
}

async function getAvailableUsers() {
    try {
        const allAccounts = await db.Account.findAll({
            attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'isActive']
        });
        
        const allEmployees = await db.Employee.findAll({
            attributes: ['userId']
        });
        
        const employeeUserIds = allEmployees.map(e => e.userId);
        
        const availableAccounts = allAccounts.filter(account => 
            account.isActive && !employeeUserIds.includes(account.id)
        );
        
        return availableAccounts;
    } catch (error) {
        console.error('Error in getAvailableUsers:', error);
        throw error;
    }
}