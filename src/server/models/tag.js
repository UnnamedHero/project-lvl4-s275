export default (sequelize, DataTypes) => {
  const Tag = sequelize.define('Tag', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
  }, {});

  Tag.associate = (models) => {
    Tag.belongsToMany(models.Task, { through: 'TaskTags', foreignKey: 'tagId' });
  };

  return Tag;
};
