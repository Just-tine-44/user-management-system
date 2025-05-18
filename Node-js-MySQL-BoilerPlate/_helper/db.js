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
    
    try {
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

        // STEP 1: Initialize models WITHOUT any relationships
        console.log("Initializing models...");
        
        // Disable foreign key checks for the entire session
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

        // STEP 2: Create ALL tables without relationships first
        console.log("Creating tables without relationships...");
        await sequelize.sync({ force: true }); // Use force:true to drop and recreate tables
        
        // STEP 3: Now define relationships AFTER tables are created
        console.log("Defining relationships...");
        
        // Account (User) relationships
        db.Account.hasMany(db.RefreshToken, { 
            foreignKey: 'accountId', 
            onDelete: 'CASCADE',
            constraints: false // Disable constraint temporarily 
        });
        db.RefreshToken.belongsTo(db.Account, { 
            foreignKey: 'accountId',
            constraints: false  
        });
        
        db.Account.hasOne(db.Employee, { 
            foreignKey: 'userId', 
            onDelete: 'CASCADE',
            constraints: false  
        });
        
        // Employee relationships
        db.Employee.belongsTo(db.Account, { 
            foreignKey: 'userId', 
            as: 'User',
            constraints: false  
        });
        
        db.Employee.belongsTo(db.Department, { 
            foreignKey: 'departmentId', 
            as: 'department',
            constraints: false 
        });
        
        db.Employee.hasMany(db.Workflow, { 
            foreignKey: 'employeeId', 
            as: 'Workflows',
            constraints: false
        });
        
        db.Employee.hasMany(db.Request, { 
            foreignKey: 'employeeId', 
            as: 'Requests',
            constraints: false
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
            constraints: false
        });
        
        db.Workflow.belongsTo(db.Account, { 
            foreignKey: 'assignedToId', 
            as: 'AssignedTo',
            constraints: false
        });
        
        // Request relationships
        db.Request.belongsTo(db.Employee, { 
            foreignKey: 'employeeId',
            as: 'employee',
            constraints: false
        });
        
        db.Request.belongsTo(db.Account, { 
            foreignKey: 'reviewerId', 
            as: 'Reviewer',
            constraints: false
        });
        
        if (db.RequestItem) {
            db.Request.hasMany(db.RequestItem, { 
                foreignKey: 'requestId', 
                as: 'items',
                onDelete: 'CASCADE',
                constraints: false
            });
            
            db.RequestItem.belongsTo(db.Request, { 
                foreignKey: 'requestId',
                constraints: false
            });
        }

        // STEP 4: Re-enable foreign key checks
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        
        console.log("Database initialization completed successfully");
        
    } catch (error) {
        console.error("Database initialization error:", error);
        throw error; // Re-throw the error to be handled by the caller
    }
}