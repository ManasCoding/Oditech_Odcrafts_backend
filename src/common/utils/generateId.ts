import { nanoid } from 'nanoid';

export const generateId = (prefix = '') => {
  return `${prefix}${nanoid(10)}`;
};
