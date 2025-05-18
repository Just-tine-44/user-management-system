const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Workflow = sequelize.define('Workflow', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        type: {
            type: DataTypes.ENUM('Onboarding', 'Offboarding', 'Transfer', 'Promotion', 'Training', 'Other'),
            allowNull: false
        },
        details: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM('Pending', 'InProgress', 'Completed', 'Canceled'),
            defaultValue: 'Pending',
            allowNull: false
        },
        startDate: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false
        },
        completionDate: {
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
        assignedToId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Accounts',
                key: 'id'
            }
        },
        priority: {
            type: DataTypes.ENUM('Low', 'Medium', 'High'),
            defaultValue: 'Medium',
            allowNull: false
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'workflows',
        timestamps: true
    });

    Workflow.associate = (models) => {
        Workflow.belongsTo(models.Employee, { 
            foreignKey: 'employeeId',
            as: 'Employee'  // Add this alias
        });
        
        Workflow.belongsTo(models.Account, { 
            foreignKey: 'assignedToId',
            as: 'AssignedTo'
        });
    };
    
    return Workflow;
};