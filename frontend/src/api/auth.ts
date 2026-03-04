import { http } from '@/api/http';

/**
 * Auth API（示例）
 *
 * 由于后端接口路径在当前仓库里不一定已最终定稿，
 * 这里先提供“清晰的调用点 + 明确的 TODO”，方便你们前后端联调时快速替换。
 */

export async function sendLoginCode(phone: string) {
  // TODO: 替换为真实接口
  // return http.post('/api/auth/sms/send/', { phone });
  await sleep(600);
  return { ok: true };
}

export async function loginWithPhoneCode(phone: string, code: string) {
  // TODO: 替换为真实接口，返回 access token
  // const { data } = await http.post('/api/auth/sms/login/', { phone, code });
  // return data as { access: string };
  await sleep(800);
  return { access: `mock_access_token_${phone}_${code}` };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

