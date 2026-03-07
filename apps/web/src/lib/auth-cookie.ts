export function setAuthCookie(status: 'with_couple' | 'no_couple' | null) {
  if (status === null) {
    document.cookie = 'uandi-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
  } else {
    document.cookie = `uandi-auth=${status}; path=/; SameSite=Lax`;
  }
}
