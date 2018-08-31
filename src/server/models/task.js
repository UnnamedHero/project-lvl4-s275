export default (sequelize, DataTypes) => {
  const Task = sequelize.define('Task', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          arg: true,
          msg: 'Value cannot be empty',
        },
      },
    },
    description: DataTypes.TEXT,
  }, {
    scopes: {
      creator: id => ({
        where: { creatorId: id },
      }),
      assignedTo: id => ({
        where: { assignedToId: id },
      }),
      taskStatus: id => ({
        where: { taskStatusId: id },
      }),
    },
  });

  Task.associate = (models) => {
    Task.belongsTo(models.User, { as: 'creator', foreignKey: 'creatorId' });
    Task.belongsTo(models.User, {
      as: 'assignedTo',
      foreignKey: {
        name: 'assignedToId',
        allowNull: true,
      },
    });
    Task.belongsTo(models.TaskStatus, { as: 'taskStatus', foreignKey: 'taskStatusId' });
    Task.belongsToMany(models.Tag, { through: 'TaskTags', foreignKey: 'taskId' });
  };

  const getTagsQuery = tags => tags
    .map(tag => ({ [sequelize.Op.eq]: tag }));

  Task.loadScopes = (models) => {
    Task.addScope('defaultTagScope', {
      include: [{ model: models.Tag }],
    });

    Task.addScope('tags', tags => ({
      include: [
        {
          model: models.Tag,
          where: {
            name: {
              [sequelize.Op.or]: getTagsQuery(tags),
            },
          },
        }],
    }));
  };

  return Task;
};
