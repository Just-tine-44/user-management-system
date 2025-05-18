const config = require('config.json');
const mysql = require('mysql2/promise');
const { Sequelize } = require('sequelize');

module.exports = db = {};

initialize();

async function initialize() {
    // Get database config from env vars or fall back to config.json
    const dbConfig = {
        host: process.env.DB_HOST || config.database.host,
        port: process.env.DB_PORT || config.database.port || 3306,
        user: process.env.DB_USER || config.database.user,
        password: process.env.DB_PASSWORD || config.database.password,
        database: process.env.DB_DATABASE || config.database.database
    };
    
    console.log('Database connection attempt with:', {
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        database: dbConfig.database,
        env: process.env.NODE_ENV || 'development'
        // password deliberately not logged
    });

    try {
        // Create database if it doesn't already exist
        const { host, port, user, password, database } = dbConfig;
        
        console.log(`Attempting MySQL connection to ${host}:${port}...`);
        
        let connection;
        try {
            // Add connection timeout and better error handling
            connection = await mysql.createConnection({ 
                host, 
                port, 
                user, 
                password,
                connectTimeout: 15000 // 15 seconds timeout
            });
            console.log('Initial database connection successful');
            
            await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
            console.log('Database created or verified successfully');
            
            // Close the connection after database creation
            await connection.end();
            console.log('Initial connection closed');
            
        } catch (connErr) {
            console.error('MySQL connection error details:', {
                message: connErr.message,
                code: connErr.code,
                errno: connErr.errno,
                sqlState: connErr.sqlState,
                host: host,
                port: port
            });
            
            // For ECONNREFUSED errors, provide helpful info
            if (connErr.code === 'ECONNREFUSED') {
                console.error('Connection refused. This typically means:');
                console.error('1. The database server is not running');
                console.error('2. The database server is blocking connections from this IP');
                console.error('3. The host/port information is incorrect');
                
                // In production, provide a way for the app to continue
                if (process.env.NODE_ENV === 'production') {
                    console.error('CRITICAL: Cannot connect to database in production.');
                    console.error('The application will start but database features will not work.');
                    return; // Exit initialization but let app continue
                }
            }
            throw connErr;
        }

        // Connect to database with Sequelize
        console.log('Setting up Sequelize connection...');
        const sequelize = new Sequelize(database, user, password, { 
            host: host,
            port: port,
            dialect: 'mysql',
            logging: process.env.NODE_ENV !== 'production', // Only log SQL in development
            dialectOptions: {
                dateStrings: true,
                typeCast: true,
                connectTimeout: 30000  // 30 seconds timeout
            },
            timezone: '+00:00', // Set timezone to UTC
            pool: {
                max: 10,
                min: 0,
                acquire: 30000,
                idle: 10000
            },
            retry: {
                match: [/Deadlock/i, /SequelizeConnectionError/],
                max: 3
            }
        });

        // Test Sequelize connection
        try {
            await sequelize.authenticate();
            console.log('Database connection established successfully.');
        } catch (authError) {
            console.error('Sequelize authentication error:', authError);
            if (process.env.NODE_ENV === 'production') {
                console.error('Failed to connect to database. API functionality will be limited.');
                return; // Exit initialization but let app continue
            }
            throw authError;
        }

        // Before syncing, disable foreign key checks to avoid circular dependency issues
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

        // Init models and add them to the exported db object
        console.log('Initializing models...');
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
        console.log('Setting up model relationships...');
        
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

        // Sync all models with database - use force:true only in development!
        console.log('Syncing database models...');
        const syncOptions = { 
            alter: process.env.NODE_ENV !== 'production',
            // force: process.env.NODE_ENV === 'development' && process.env.DB_FORCE_SYNC === 'true'
        };
        
        try {
            await sequelize.sync(syncOptions);
            console.log(`Database sync completed with options:`, syncOptions);
        } catch (syncError) {
            console.error('Error syncing database:', syncError);
            // Try again without alter if that fails
            if (syncError.message.includes('foreign key')) {
                console.log('Retrying sync without altering tables...');
                await sequelize.sync({ alter: false });
                console.log('Database sync completed without altering tables');
            } else {
                throw syncError;
            }
        }
        
        // Re-enable foreign key checks after sync
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        
        console.log("Database initialization completed successfully");
    } catch (err) {
        console.error('Database initialization error:', err);
        
        // In production, log the error but allow the app to start
        if (process.env.NODE_ENV === 'production') {
            console.error('Database error in production. API functionality will be limited.');
            console.error('Error details:', {
                message: err.message,
                code: err.code,
                stack: err.stack
            });
            // Don't throw in production to allow app to start without DB
        } else {
            // In development, throw the error to stop the app
            throw err;
        }
    }
}