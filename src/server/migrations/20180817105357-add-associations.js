'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'Tasks',
      'creatorId',
      {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
    )
    .then(() => {
      return queryInterface.addColumn(
        'Tasks',
        'assignedToId',
        {
          type: Sequelize.INTEGER,
          references: {
            model: 'Users',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
      )        
    })
    .then(() => {
      return queryInterface.addColumn(
        'Tasks',
        'taskStatusId',
        {
          type: Sequelize.INTEGER,
          references: {
            model: 'TaskStatuses',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
      )
        
    })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'Tasks',
      'creatorId',
    )
    .then(() => {
      return queryInterface.removeColumn(
        'Tasks',
        'statusId',
      );  
    });
  }
};
