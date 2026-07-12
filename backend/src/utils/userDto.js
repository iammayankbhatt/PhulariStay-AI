export const toSafeUser = (user) => ({
  id: user.id,
  name: user.fullName,
  email: user.email,
  role: user.role,
  avatar: user.profileImage,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});
