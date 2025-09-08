import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import RefreshToken from '../models/RefreshToken.js'

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here'
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your_refresh_token_secret_here'

// Thời gian hết hạn
const ACCESS_TOKEN_EXPIRES = '15m' // 15 phút
const REFRESH_TOKEN_EXPIRES = '7d' // 7 ngày

// Tạo access token (chứa id + role)
export const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES })
}

// Tạo refresh token (random string)
export const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex')
}

// Lưu refresh token vào database
export const saveRefreshToken = async (token, userId, deviceInfo = {}) => {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 ngày

  const refreshToken = new RefreshToken({
    token,
    userId,
    expiresAt,
    deviceInfo
  })

  await refreshToken.save()
  return refreshToken
}

// Xác thực access token
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

// Xác thực refresh token
export const verifyRefreshToken = async (token) => {
  try {
    const refreshToken = await RefreshToken.findValidToken(token)
    return refreshToken
  } catch (error) {
    return null
  }
}

// Tạo cặp token mới
export const generateTokenPair = async (userPayload, deviceInfo = {}) => {
  const accessToken = generateAccessToken(userPayload)
  const refreshToken = generateRefreshToken()

  await saveRefreshToken(refreshToken, userPayload.id, deviceInfo)

  return {
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_EXPIRES
  }
}

// Refresh access token
export const refreshAccessToken = async (refreshToken) => {
  const validRefreshToken = await verifyRefreshToken(refreshToken)

  if (!validRefreshToken) {
    throw new Error('Invalid refresh token')
  }

  const user = validRefreshToken.userId

  // Tạo access token mới
  const newAccessToken = generateAccessToken({ id: user._id, role: user.role })

  return {
    accessToken: newAccessToken,
    expiresIn: ACCESS_TOKEN_EXPIRES,
    user
  }
}

// Vô hiệu hóa refresh token
export const revokeRefreshToken = async (token) => {
  return await RefreshToken.revokeToken(token)
}

// Vô hiệu hóa tất cả token của user
export const revokeAllUserTokens = async (userId) => {
  return await RefreshToken.revokeAllUserTokens(userId)
}
