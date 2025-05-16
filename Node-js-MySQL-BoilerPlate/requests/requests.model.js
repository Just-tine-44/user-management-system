const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Request = sequelize.define('Request', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        type: {
            type: DataTypes.ENUM('Leave', 'Equipment', 'Training', 'Reimbursement', 'Other'),
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Canceled'),
            defaultValue: 'Pending',
            allowNull: false
        },
        priority: {
            type: DataTypes.ENUM('Low', 'Medium', 'High'),
            defaultValue: 'Medium',
            allowNull: false
        },
        submissionDate: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false
        },
        resolutionDate: {
            type: DataTypes.DATE,
            allowNull: true
        },
        employeeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Employees',
                key: 'id'
            }
        },
        reviewerId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Accounts', // Changed from 'Users' to 'Accounts'
                key: 'id'
            }
        },
        comments: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'requests',
        timestamps: true // createdAt and updatedAt fields
    });

    // Define associations
    Request.associate = (models) => {
        Request.belongsTo(models.Employee, { foreignKey: 'employeeId' });
        Request.belongsTo(models.Account, { // Changed from models.User to models.Account
            foreignKey: 'reviewerId', 
            as: 'Reviewer' 
        });
        Request.hasMany(models.RequestItem, { 
            foreignKey: 'requestId',
            as: 'items', // Added alias for the association
            onDelete: 'CASCADE' // Delete request items when request is deleted
        });
    };

    return Request;
};

// Define RequestItem model as well since it's referenced in the controller
module.exports.RequestItem = (sequelize) => {
    const RequestItem = sequelize.define('RequestItem', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        quantity: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
            allowNull: false
        },
        unitPrice: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        requestId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Requests',
                key: 'id'
            }
        }
    }, {
        tableName: 'request_items',
        timestamps: true
    });

    RequestItem.associate = (models) => {
        RequestItem.belongsTo(models.Request, { 
            foreignKey: 'requestId',
            as: 'request' // Added alias for the association
        });
    };

    return RequestItem;
};