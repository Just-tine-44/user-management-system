const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Department = sequelize.define('Department', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        location: {
            type: DataTypes.STRING,
            allowNull: true
        },
        managerId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            // Remove the explicit references to avoid circular dependency
            // Will be handled by the associate method and manual constraints
        },
        status: {
            type: DataTypes.ENUM('Active', 'Inactive'),
            defaultValue: 'Active',
            allowNull: false
        }
    }, {
        tableName: 'departments',
        timestamps: true // createdAt and updatedAt fields
    });

    // Define associations
    Department.associate = (models) => {
        Department.hasMany(models.Employee, { 
            foreignKey: 'departmentId',
            constraints: false // Prevents circular reference issues
        });
        
        Department.belongsTo(models.Employee, { 
            foreignKey: 'managerId', 
            as: 'Manager',
            constraints: false // Prevents circular reference issues
        });
    };

    return Department;
};