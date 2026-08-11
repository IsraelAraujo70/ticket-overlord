export const USER_ROLES = [
  'CUSTOMER',
  'ORGANIZER',
  'ADMIN',
  'ORGANIZER_STAFF',
] as const;

export type UserRole = (typeof USER_ROLES)[number];
