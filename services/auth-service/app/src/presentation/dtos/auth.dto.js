export const toUserDto = (user) => ({
  email: user.email,
  role: user.role,
  id: user.id,
  is_active: user.isActive,
  created_at: user.createdAt,
  updated_at: user.updatedAt,
});

export const toTokenDto = ({ accessToken, refreshToken, user }) => ({
  access_token: accessToken,
  refresh_token: refreshToken,
  token_type: 'bearer',
  user: toUserDto(user),
});

export const toTokenPairDto = ({ accessToken, refreshToken }) => ({
  access_token: accessToken,
  refresh_token: refreshToken,
});

export const toVerifyDto = ({ valid, userId, role }) => ({
  valid,
  user_id: userId,
  role,
});
