import type { PATH_ROUTE } from '../../../common/dto';

const BASE_URL = ''; // Proxied via Vite

export const authApi = {
  /**
   * 메일 인증 코드 발송
   */
  async sendMailCode(address: string) {
    const params = new URLSearchParams({ address });
    const response = await fetch(`${BASE_URL}/api/auth/verify/mail?${params.toString()}`);
    return (await response.json()) as PATH_ROUTE['/api/auth/verify/mail']['GET']['RES'];
  },

  /**
   * 메일 인증 코드 확인
   */
  async verifyMailCode(address: string, code: string) {
    const response = await fetch(`${BASE_URL}/api/auth/verify/mail`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, code }),
    });
    return (await response.json()) as PATH_ROUTE['/api/auth/verify/mail']['POST']['RES'];
  },

  /**
   * 회원가입
   */
  async signup(data: PATH_ROUTE['/api/auth/signup']['POST']['REQ']) {
    const response = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return (await response.json()) as PATH_ROUTE['/api/auth/signup']['POST']['RES'];
  },

  /**
   * 로그인
   */
  async login(data: PATH_ROUTE['/api/auth/login']['POST']['REQ']) {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return (await response.json()) as PATH_ROUTE['/api/auth/login']['POST']['RES'];
  },
};
