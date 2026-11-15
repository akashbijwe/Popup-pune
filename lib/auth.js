import crypto from 'crypto';
import { cookies } from 'next/headers';
import { ADMIN_USER, ADMIN_PASS, AUTH_SECRET } from './config';

export const COOKIE = 'twc_admin';
export const makeToken = () =>
  crypto.createHash('sha256').update(`${ADMIN_USER}:${ADMIN_PASS}:${AUTH_SECRET}`).digest('hex');
export const isAuthed = () => cookies().get(COOKIE)?.value === makeToken();
