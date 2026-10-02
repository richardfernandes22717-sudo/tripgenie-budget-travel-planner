import {createContext,useContext,useEffect,useMemo,useState,type ReactNode} from 'react';import api from '../api/client';import type{User}from'../types';
type AuthValue={user:User|null;loading:boolean;login:(email:string,password:string)=>Promise<void>;register:(data:{name:string;email:string;password:string})=>Promise<void>;logout:()=>void;refreshUser:()=>Promise<void>};
const C=createContext<AuthValue|null>(null);
export function AuthProvider({children}:{children:ReactNode}){const [user,setUser]=useState<User|null>(()=>{try{return JSON.parse(localStorage.getItem('tripgenie_user')||'null')}catch{return null}});const[loading,setLoading]=useState(true);
 const save=(u:User,token:string,refresh?:string)=>{setUser(u);localStorage.setItem('tripgenie_user',JSON.stringify(u));localStorage.setItem('tripgenie_access',token);if(refresh)localStorage.setItem('tripgenie_refresh',refresh)};
 const refreshUser=async()=>{if(!localStorage.getItem('tripgenie_access'))return;const{data}=await api.get('/auth/me');setUser(data.data);localStorage.setItem('tripgenie_user',JSON.stringify(data.data));};
 useEffect(()=>{refreshUser().catch(()=>setUser(null)).finally(()=>setLoading(false))},[]);
 const login=async(email:string,password:string)=>{const{data}=await api.post('/auth/login',{email,password});save(data.data.user,data.data.accessToken,data.data.refreshToken)};
 const register=async(payload:{name:string;email:string;password:string})=>{const{data}=await api.post('/auth/register',payload);save(data.data.user,data.data.accessToken,data.data.refreshToken)};
 const logout=()=>{const refreshToken=localStorage.getItem('tripgenie_refresh');api.post('/auth/logout',{refreshToken}).catch(()=>{});localStorage.clear();setUser(null)};
 return <C.Provider value={useMemo(()=>({user,loading,login,register,logout,refreshUser}),[user,loading])}>{children}</C.Provider>}
export const useAuth=()=>{const v=useContext(C);if(!v)throw new Error('AuthProvider missing');return v};
