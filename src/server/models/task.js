export default (sequelize, DataTypes) => {
  const Task = sequelize.define('Task', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: DataTypes.TEXT,
  }, {});

  Task.associate = (models) => {
    Task.belongsTo(models.User, { as: 'creator', onDelete: 'SET NULL' });
    Task.belongsTo(models.TaskStatus, { as: 'taskStatus', onDelete: 'SET NULL' });
    Task.belongsTo(models.User, { as: 'assignedTo', onDelete: 'SET NULL' });
    Task.belongsToMany(models.Tag, { through: 'TaskTags', foreignKey: 'taskId' });
  };

  return Task;
};
