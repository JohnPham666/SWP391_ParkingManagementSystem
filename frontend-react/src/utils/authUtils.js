export const getDefaultRouteByRole = (user) => {
  if (!user || !user.role) return '/login';

  const role = user.role.toUpperCase();

  switch (role) {
    case 'ROLE_ADMIN':
      return '/admin';
    case 'ROLE_PARKING_MANAGER':
      return '/manager';
    case 'ROLE_PARKING_STAFF':
      return '/staff';
    case 'ROLE_DRIVER':
      return '/driver/dashboard';
    default:
      return '/';
  }
};
