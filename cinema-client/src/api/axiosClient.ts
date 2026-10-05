import axios from 'axios';
import toast from 'react-hot-toast';
export const api=axios.create({baseURL:'http://localhost:8080',timeout:20000});
api.interceptors.request.use(c=>{const token=localStorage.getItem('cinema-token');if(token)c.headers.Authorization='Bearer '+token;return c;});
api.interceptors.response.use(r=>r,e=>{const status=e.response?.status;if(status===401&&!e.config?.url?.includes('/login')){localStorage.removeItem('cinema-token');window.dispatchEvent(new Event('session-expired'));}if(status===403)toast.error('Bạn không có quyền truy cập');if(status===409)toast.error(e.response?.data?.message||'Dữ liệu vừa thay đổi');if(status>=500)toast.error(e.response?.data?.message||'Dịch vụ chưa sẵn sàng, vui lòng thử lại');return Promise.reject(e);});
export async function get<T=any>(url:string):Promise<T>{return (await api.get(url)).data.data;}
export async function send<T=any>(url:string,data:any={},method='post'):Promise<T>{return (await api.request({url,data,method})).data.data;}
export function errorText(e:any){return e.response?.data?.message||'Không kết nối được máy chủ. Vui lòng thử lại.';}
export const money=(value:number)=>new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(value||0);
export const asset=(url?:string)=>url?.startsWith('/uploads/')?'http://localhost:8080'+url:url||'';
