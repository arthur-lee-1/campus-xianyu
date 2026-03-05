import { http } from '@/api/http';

export async function sendLoginCode(phone: string) {
  // 对齐 auth.py: path('sms/', ...) -> /api/auth/sms/
  const { data } = await http.post('/api/auth/sms/', { phone });
  return data;
}

export async function loginWithPhoneCode(phone: string, code: string) {
  // 对齐 auth.py: path('login/phone/', ...) -> /api/auth/login/phone/
  const { data } = await http.post('/api/auth/login/phone/', { phone, code });
  
  // Django 视图 PhoneLoginView 成功时返回的结构被 success() 包裹
  // 实际数据通常在 data.data 中包含 access, refresh, is_new, user 等字段
  return data.data as { 
    access: string; 
    refresh: string; 
    is_new: boolean; 
    user: any 
  };
}