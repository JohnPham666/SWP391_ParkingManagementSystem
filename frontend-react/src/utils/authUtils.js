export const getDefaultRouteByRole = (user) => {
  if (!user || !user.role) return '/login';

  let role = user.role.toUpperCase();
  if (role.startsWith('ROLE_')) {
    role = role.substring(5);
  }

  switch (role) {
    case 'ADMIN':
      return '/admin';
    case 'PARKING_MANAGER':
      return '/manager';
    case 'PARKING_STAFF':
      return '/staff';
    case 'DRIVER':
      return '/driver/dashboard';
    default:
      return '/';
  }
};
