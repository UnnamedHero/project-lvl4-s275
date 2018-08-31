export default (sequelize, DataTypes) => {
  const TaskStatus = sequelize.define('TaskStatus', {
    name: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        notEmpty: {
          arg: true,
          msg: 'Value cannot be empty',
        },
      },
    },
  });
  TaskStatus.assosiate = (models) => {
    TaskStatus.hasMany(models.Task, { foreignKey: 'taskStatusId' });
  };
  return TaskStatus;
};
