import uniq from 'lodash/uniq';
import { Tag } from '../../server/models'; //eslint-disable-line

const getTagsFromString = str => uniq(str
  .split(' ')
  .map(tagName => tagName.trim())
  .filter(tag => tag));

const getOrCreateTags = async (tagNames) => {
  const iter = async (acc, tags) => {
    const [tagName, ...rest] = tags;
    if (!tagName) {
      return acc;
    }

    const [result] = await Tag.findOrCreate({ where: { name: tagName } });
    return iter([...acc, result], rest);
  };
  const tags = await iter([], tagNames);
  return tags;
};

export const getTags = async (stringOfTags) => {
  const tagNames = getTagsFromString(stringOfTags);
  const tags = await getOrCreateTags(tagNames);
  return tags;
};

export const makeTags = tags => tags.map(tag => tag.name).join(' ');
