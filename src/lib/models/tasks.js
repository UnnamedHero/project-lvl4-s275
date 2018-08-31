import { TaskStatus } from '../../server/models'; // eslint-disable-line
import nameOrEmail from '../nameOrEmail';

const makeFilterItem = (name, selectedId) => {
  const id = name.toLowerCase();
  return {
    id,
    name,
    selected: selectedId === id,
  };
};

export const makeUserLists = (users, currentUserId, selectedUserId = 'any') => {
  const currentId = String(currentUserId);
  const selectedId = String(selectedUserId);
  const otherUsers = users
    .filter(user => String(user.id) !== currentId)
    .map((user) => {
      const id = String(user.id);
      const name = nameOrEmail(user);
      const selected = id === selectedId;
      return ({ id, name, selected });
    });

  const currentUser = {
    id: currentUserId,
    name: 'Me',
    selected: currentId === selectedId,
  };

  const any = makeFilterItem('Any', selectedId);
  const nobody = makeFilterItem('Nobody', selectedId);

  return {
    createdBy: [any, currentUser, ...otherUsers],
    assignedTo: [nobody, currentUser, ...otherUsers],
    assignedToForFilter: [any, nobody, currentUser, ...otherUsers],
  };
};

export const makeTaskStatusLists = async (selectedId) => {
  const taskStatuses = await TaskStatus.findAll();
  const realSelectedId = selectedId || taskStatuses[0].id;
  const taskStatusesWithSelected = taskStatuses.map(taskStatus => ({
    id: taskStatus.id,
    name: taskStatus.name,
    selected: String(realSelectedId) === String(taskStatus.id),
  }));
  const any = makeFilterItem('Any', selectedId);
  return {
    taskStatuses: taskStatusesWithSelected,
    taskStatusesForFilter: [any, ...taskStatusesWithSelected],
  };
};
