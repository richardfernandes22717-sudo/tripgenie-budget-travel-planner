import axios from 'axios';
const api=axios.create({baseURL:import.meta.env.VITE_API_URL||'http://localhost:5000/api',timeout:35000});
api.interceptors.request.use(config=>{const token=localStorage.getItem('tripgenie_access');if(token)config.headers.Authorization=`Bearer ${token}`;return config;});
api.interceptors.response.use(r=>r,err=>{if(err.response?.status===401&&!err.config?.url?.includes('/auth/login')){localStorage.removeItem('tripgenie_access');localStorage.removeItem('tripgenie_user');}return Promise.reject(err);});
export const imageUrl=(value?:string)=>{if(!value)return '/fallback.svg';if(value.startsWith('/uploads'))return `${(import.meta.env.VITE_API_URL||'http://localhost:5000/api').replace(/\/api$/,'')}${value}`;return value;};
export default api;
