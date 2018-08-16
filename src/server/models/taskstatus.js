export default (sequelize, DataTypes) => {
  const TaskStatus = sequelize.define('TaskStatus', {
    name: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
  });
  // TaskStatus.associate = function(models) {
    // associations can be defined here
  // };
  return TaskStatus;
};
