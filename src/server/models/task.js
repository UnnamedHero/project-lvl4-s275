export default (sequelize, DataTypes) => {
  const Task = sequelize.define('Task', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: DataTypes.TEXT,
  }, {});

  Task.associate = (models) => {
    Task.belongsTo(models.User, { as: 'creator', foreignKey: 'creatorId' });
    Task.belongsTo(models.TaskStatus, { as: 'taskStatus', foreignKey: 'taskStatusId' });
    Task.belongsTo(models.User, { as: 'assignedTo', foreignKey: 'assignedToId' });
    Task.belongsToMany(models.Tag, { through: 'TaskTags', foreignKey: 'taskId' });
  };

  return Task;
};
