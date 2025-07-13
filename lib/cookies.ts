// src/lib/cookies.ts
// This file is mostly illustrative as js-cookie is used directly in page.tsx now.
import Cookies from 'js-cookie';

export const setAuthToken = (token: string) => {
  Cookies.set('auth_token', token, { expires: 1, secure: process.env.NODE_ENV === 'production' }); // 1 day expiry
};

export const getAuthToken = () => {
  return Cookies.get('auth_token');
};

export const removeAuthToken = () => {
  Cookies.remove('auth_token');
};