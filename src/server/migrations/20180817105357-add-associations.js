'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'Tasks',
      'creatorId',
      {
        type: Sequelize.INTEGER,
        references: {
          model: 'User',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
    )
    .then(() => {
      return queryInterface.addColumn(
        'Tasks',
        'statusId',
        {
          type: Sequelize.INTEGER,
          references: {
            model: 'TaskStatus',
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
