const config = require('config.json');
const mysql = require('mysql2/promise');
const { Sequelize } = require('sequelize');

module.exports = db = {};

initialize();

async function initialize() {
    try {
        // Use environment variables if available, otherwise fall back to config
        const host = process.env.DB_HOST || config.database.host;
        const port = process.env.DB_PORT || config.database.port;
        const user = process.env.DB_USER || config.database.user;
        const password = process.env.DB_PASSWORD || config.database.password;
        const database = process.env.DB_NAME || config.database.database;
        
        console.log(`Attempting to connect to MySQL at ${host}:${port}`);
        
        // Create database if it doesn't already exist
        const connection = await mysql.createConnection({ host, port, user, password });
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
        
        // Close the connection after database creation
        await connection.end();
        
        console.log("Successfully connected to database");

        // Connect to database with options
        const sequelize = new Sequelize(database, user, password, { 
            host: host,
            port: port,
            dialect: 'mysql',
            logging: console.log, // Enable SQL logging for debugging
            dialectOptions: {
                dateStrings: true,
                typeCast: true,
            },
            timezone: '+00:00' // Set timezone to UTC
        });

        // Test the connection
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        // Before syncing, disable foreign key checks to avoid circular dependency issues
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

        // Init models and add them to the exported db object
        db.Account = require('../accounts/account.model')(sequelize);
        db.RefreshToken = require('../accounts/refresh-token.model')(sequelize);
        db.Department = require('../departments/departments.model')(sequelize);
        db.Employee = require('../employees/employees.model')(sequelize);
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
            as: 'Workflows' 
        });
        
        db.Employee.hasMany(db.Request, { 
            foreignKey: 'employeeId', 
            as: 'Requests' 
        });
        
        // Department relationships
        db.Department.hasMany(db.Employee, { 
            foreignKey: 'departmentId',
            constraints: false 
        });
        
        
        // Workflow relationships
        db.Workflow.belongsTo(db.Employee, { 
            foreignKey: 'employeeId', 
            as: 'Employee' 
        });
        
        db.Workflow.belongsTo(db.Account, { 
            foreignKey: 'assignedToId', 
            as: 'AssignedTo' 
        });
        
        // Request relationships - FIXED: Changed 'RequestItems' to 'items' to match controller code
        db.Request.belongsTo(db.Employee, { 
            foreignKey: 'employeeId',
            as: 'employee' 
        });
        
        db.Request.belongsTo(db.Account, { 
            foreignKey: 'reviewerId', 
            as: 'Reviewer' 
        });
        
        if (db.RequestItem) {
            db.Request.hasMany(db.RequestItem, { 
                foreignKey: 'requestId', 
                as: 'items', // Changed from 'RequestItems' to 'items' to match controller
                onDelete: 'CASCADE' 
            });
            
            db.RequestItem.belongsTo(db.Request, { 
                foreignKey: 'requestId'
            });
        }

        // Sync all models with database
        await sequelize.sync({ alter: true });
        
        // Re-enable foreign key checks after sync
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        
        console.log("Database initialization completed successfully");
    } catch (error) {
        console.error("Database initialization failed:", error);
        // Don't exit the process, let the server handle errors
    }
}