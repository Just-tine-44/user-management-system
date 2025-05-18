const config = require('../config');
const mysql = require('mysql2/promise');
const { Sequelize } = require('sequelize');

module.exports = db = {};

initialize();

async function initialize() {
    // Use environment variables if available, otherwise use config.json
    const dbConfig = {
        host: process.env.DB_HOST || config.database.host,
        port: parseInt(process.env.DB_PORT) || config.database.port,
        user: process.env.DB_USER || config.database.user,
        password: process.env.DB_PASSWORD || config.database.password,
        database: process.env.DB_NAME || config.database.database
    };
    
    console.log('Database configuration:', {
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        database: dbConfig.database
    });
    
    // Connect to DB
    const connection = await mysql.createConnection({ 
        host: dbConfig.host, 
        port: dbConfig.port,
        user: dbConfig.user, 
        password: dbConfig.password 
    });
    
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`);
    
    // Connect to DB with Sequelize
    const sequelize = new Sequelize(
        dbConfig.database,
        dbConfig.user,
        dbConfig.password,
        {
            host: dbConfig.host,
            port: dbConfig.port,
            dialect: 'mysql',
            logging: console.log, // Enable SQL logging for debugging
            dialectOptions: {
                supportBigNumbers: true,
                bigNumberStrings: true
            }
        }
    );

    // Temporarily disable foreign key checks during model initialization
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    // Init models and add them to the exported db object
    db.Account = require('../accounts/account.model')(sequelize);
    db.RefreshToken = require('../accounts/refresh-token.model')(sequelize);
    db.Department = require('../departments/departments.model')(sequelize);
    db.Employee = require('../employees/employees.model')(sequelize);
    
    // Create these tables first in proper order
    await db.Account.sync({ alter: true });
    await db.Department.sync({ alter: true });
    await db.RefreshToken.sync({ alter: true });
    await db.Employee.sync({ alter: true });
    
    // Now load and create tables that depend on the above
    db.Workflow = require('../workflows/workflows.model')(sequelize);
    db.Request = require('../requests/requests.model')(sequelize);

    // Initialize nested models
    try {
        db.RequestItem = require('../requests/requests.model').RequestItem(sequelize);
        console.log('RequestItem model initialized successfully');
    } catch (err) {
        console.warn('RequestItem model not found or error initializing:', err.message);
    }

    // Define relationships - note that model names must match what's used in the models
    
    // Account (User) relationships
    db.Account.hasMany(db.RefreshToken, { 
        foreignKey: 'accountId', 
        onDelete: 'CASCADE' 
    });
    db.RefreshToken.belongsTo(db.Account, { 
        foreignKey: 'accountId' 
    });
    
    db.Account.hasOne(db.Employee, { 
        foreignKey: 'userId', 
        onDelete: 'CASCADE' 
    });
    
    // Employee relationships
    db.Employee.belongsTo(db.Account, { 
        foreignKey: 'userId', 
        as: 'User' 
    });
    
    db.Employee.belongsTo(db.Department, { 
        foreignKey: 'departmentId', 
        as: 'department',
        constraints: false 
    });
    
    db.Employee.hasMany(db.Workflow, { 
        foreignKey: 'employeeId', 
        as: 'Workflows',
        constraints: false  // Temporarily disable constraint
    });
    
    db.Employee.hasMany(db.Request, { 
        foreignKey: 'employeeId', 
        as: 'Requests',
        constraints: false  // Temporarily disable constraint
    });
    
    // Department relationships
    db.Department.hasMany(db.Employee, { 
        foreignKey: 'departmentId',
        constraints: false 
    });
    
    
    // Workflow relationships
    db.Workflow.belongsTo(db.Employee, { 
        foreignKey: 'employeeId', 
        as: 'Employee',
        constraints: false  // Temporarily disable constraint
    });
    
    db.Workflow.belongsTo(db.Account, { 
        foreignKey: 'assignedToId', 
        as: 'AssignedTo',
        constraints: false  // Temporarily disable constraint
    });
    
    // Request relationships - FIXED: Changed 'RequestItems' to 'items' to match controller code
    db.Request.belongsTo(db.Employee, { 
        foreignKey: 'employeeId',
        as: 'employee',
        constraints: false  // Temporarily disable constraint
    });
    
    db.Request.belongsTo(db.Account, { 
        foreignKey: 'reviewerId', 
        as: 'Reviewer',
        constraints: false  // Temporarily disable constraint
    });
    
    if (db.RequestItem) {
        db.Request.hasMany(db.RequestItem, { 
            foreignKey: 'requestId', 
            as: 'items', // Changed from 'RequestItems' to 'items' to match controller
            onDelete: 'CASCADE',
            constraints: false  // Temporarily disable constraint
        });
        
        db.RequestItem.belongsTo(db.Request, { 
            foreignKey: 'requestId',
            constraints: false  // Temporarily disable constraint
        });
    }

    // Now sync the rest of the tables
    await db.Workflow.sync({ alter: true });
    await db.Request.sync({ alter: true });
    
    if (db.RequestItem) {
        await db.RequestItem.sync({ alter: true });
    }
    
    // Re-enable foreign key checks after all tables are created
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    
    // Now try to add the constraints back if needed
    try {
        // You could add specific ALTER TABLE statements here if needed
        // For example:
        // await sequelize.query('ALTER TABLE `workflows` ADD CONSTRAINT `fk_workflow_employee` FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`);');
    } catch (err) {
        console.warn('Error adding constraints:', err.message);
    }
    
    console.log("Database initialization completed successfully");
}