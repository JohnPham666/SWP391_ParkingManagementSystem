export const getDefaultRouteByRole = (user) => {
  if (!user || !user.role) return '/login';

  let role = user.role.toUpperCase();
  if (role.startsWith('ROLE_')) {
    role = role.substring(5);
  }

  switch (role) {
    case 'ADMIN':
      return '/admin';
    case 'PARKINGMANAGER':
    case 'PARKING_MANAGER': // Fallback just in case
      return '/manager';
    case 'PARKINGSTAFF':
    case 'PARKING_STAFF': // Fallback just in case
      return '/staff';
    case 'DRIVER':
      return '/driver/dashboard';
    default:
      return '/';
  }
};
