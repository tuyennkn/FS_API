/**
 * Auth DTO - Data Transfer Object cho Authentication
 */

import { UserDTO } from './UserDTO.js'

/**
 * DTO cho Auth
 */
export const AuthDTO = {
  /**
   * Chuẩn hóa response đăng nhập/đăng ký
   * @param {object} user - User object
   * @param {object} tokens - Token pair
   * @returns {object} Auth response
   */
  toLoginResponse: (user, tokens) => {
    return {
      user: UserDTO.toResponse(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn
    }
  },

  /**
   * Chuẩn hóa response refresh token
   * @param {object} user - User object
   * @param {string} accessToken - New access token
   * @param {number} expiresIn - Token expiration time
   * @returns {object} Refresh token response
   */
  toRefreshResponse: (user, accessToken, expiresIn) => {
    return {
      user: UserDTO.toResponse(user),
      accessToken,
      expiresIn
    }
  },

  /**
   * Chuẩn hóa response đăng ký
   * @param {object} user - User object
   * @param {object} tokens - Token pair
   * @returns {object} Register response
   */
  toRegisterResponse: (user, tokens) => {
    return {
      user: UserDTO.toResponse(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn
    }
  },

  /**
   * Chuẩn hóa response profile
   * @param {object} user - User object
   * @returns {object} Profile response
   */
  toProfileResponse: (user) => {
    return UserDTO.toResponse(user)
  }
}
