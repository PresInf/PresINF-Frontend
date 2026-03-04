import instance from './axios';

export const getLogs = async () => {
  return await instance.get('/logs');
};