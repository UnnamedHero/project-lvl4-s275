const createdAt = {
  createdAt: new Date(),
  updatedAt: new Date(),
};

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('TaskStatuses', [
      { id: 1, name: 'New', ...createdAt },
      { id: 2, name: 'In Progress', ...createdAt },
      { id: 3, name: 'Testing', ...createdAt },
      { id: 4, name: 'Complete', ...createdAt },
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('TaskStatuses', null, {});
  }
};
