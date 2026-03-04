import axios from './axios';



export const registerRequest = (User) => axios.post(`/auth/register`, User)

export const loginRequest = (User) => axios.post(`/auth/login`, User, { withCredentials: true });

export const verifyTokenRequest = () => axios.get(`/auth/verify`, { withCredentials: true });


