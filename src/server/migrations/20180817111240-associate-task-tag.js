'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(
      'TaskTags', 
      { 
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE
        },
        taskId: {
          type: Sequelize.INTEGER,
          primaryKey: true,
        },
        tagId: {
          type: Sequelize.INTEGER,
          primaryKey: true,
        },
      });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('TaskTags');
  }
};
