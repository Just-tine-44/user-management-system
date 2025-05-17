const db = require('_helper/db');
const { Op } = require('sequelize');

module.exports = {
    create,
    getAll,
    getById,
    update,
    delete: _delete,
    setManager
};

async function create(params) {
    // Check for duplicate department name
    const existingDepartment = await db.Department.findOne({ where: { name: params.name } });
    if (existingDepartment) {
        throw new Error(`Department with name '${params.name}' already exists`);
    }
    
    // Validate manager if provided
    if (params.managerId) {
        const manager = await db.Employee.findByPk(params.managerId);
        if (!manager) {
            throw new Error('Manager not found');
        }
    }
    
    const department = await db.Department.create(params);
    return department;
}

async function getAll() {
    const departments = await db.Department.findAll({
        include: [
            { 
                model: db.Employee, 
                attributes: ['id'] 
            },
            {
                model: db.Employee,
                as: 'Manager',
                include: [
                    { 
                        model: db.User, 
                        attributes: ['id', 'firstName', 'lastName', 'email'] 
                    }
                ]
            }
        ]
    });
    
    return departments.map(department => {
        const deptJson = department.toJSON();
        return {
            ...deptJson,
            employeeCount: deptJson.Employees ? deptJson.Employees.length : 0,
            Manager: deptJson.Manager ? {
                id: deptJson.Manager.id,
                name: deptJson.Manager.User ? 
                    `${deptJson.Manager.User.firstName} ${deptJson.Manager.User.lastName}` : 
                    null,
                email: deptJson.Manager.User ? deptJson.Manager.User.email : null
            } : null
        };
    });
}

async function getById(id) {
    const department = await db.Department.findByPk(id, {
        include: [
            { 
                model: db.Employee,
                include: [
                    { model: db.User, attributes: ['id', 'firstName', 'lastName', 'email'] }
                ]
            },
            {
                model: db.Employee,
                as: 'Manager',
                include: [
                    { model: db.User, attributes: ['id', 'firstName', 'lastName', 'email'] }
                ]
            }
        ]
    });
    
    if (!department) {
        throw new Error('Department not found');
    }
    
    const deptJson = department.toJSON();
    
    return {
        ...deptJson,
        employeeCount: deptJson.Employees ? deptJson.Employees.length : 0,
        Manager: deptJson.Manager ? {
            id: deptJson.Manager.id,
            name: deptJson.Manager.User ? 
                `${deptJson.Manager.User.firstName} ${deptJson.Manager.User.lastName}` : 
                null,
            email: deptJson.Manager.User ? deptJson.Manager.User.email : null
        } : null
    };
}

async function update(id, params) {
    const department = await db.Department.findByPk(id);
    
    if (!department) {
        throw new Error('Department not found');
    }
    
    // Check for duplicate name if name is being changed
    if (params.name && params.name !== department.name) {
        const existingDepartment = await db.Department.findOne({ 
            where: { 
                name: params.name,
                id: { [Op.ne]: id }
            } 
        });
        
        if (existingDepartment) {
            throw new Error(`Department with name '${params.name}' already exists`);
        }
    }
    
    // Validate manager if provided
    if (params.managerId && params.managerId !== department.managerId) {
        const manager = await db.Employee.findByPk(params.managerId);
        if (!manager) {
            throw new Error('Manager not found');
        }
    }
    
    // Copy params properties to department
    Object.assign(department, params);
    await department.save();
    
    return department;
}

async function _delete(id) {
    const department = await db.Department.findByPk(id, {
        include: [{ model: db.Employee }]
    });
    
    if (!department) {
        throw new Error('Department not found');
    }
    
    // Check if department has employees
    if (department.Employees && department.Employees.length > 0) {
        throw new Error('Cannot delete department with employees. Transfer or remove employees first.');
    }
    
    await department.destroy();
}

async function setManager(id, managerId) {
    const department = await db.Department.findByPk(id);
    
    if (!department) {
        throw new Error('Department not found');
    }
    
    // Validate manager exists and is active
    const manager = await db.Employee.findByPk(managerId, {
        include: [{ model: db.User }]
    });
    
    if (!manager) {
        throw new Error('Manager not found');
    }
    
    if (manager.status !== 'Active') {
        throw new Error('Cannot assign inactive employee as manager');
    }
    
    // Check if manager is in the same department
    if (manager.departmentId !== department.id) {
        throw new Error('Manager must be an employee in this department');
    }
    
    department.managerId = managerId;
    await department.save();
    
    return department;
}