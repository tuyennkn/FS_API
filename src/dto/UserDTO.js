/**
 * User DTO - Data Transfer Object cho User
 */

/**
 * DTO cho User
 */
export const UserDTO = {
  /**
   * Chuẩn hóa thông tin user để trả về client
   * @param {object} user - User object từ database
   * @returns {object} Cleaned user data
   */
  toResponse: (user) => {
    if (!user) return null
    
    return {
      id: user._id,
      username: user.username,
      fullname: user.fullname,
      email: user.email,
      phone: user.phone,
      gender: user.gender,
      birthday: user.birthday,
      avatar: user.avatar,
      persona: user.persona,
      address: user.address,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
  },

  /**
   * Chuẩn hóa thông tin user public (ẩn thông tin nhạy cảm)
   * @param {object} user - User object từ database
   * @returns {object} Public user data
   */
  toPublicResponse: (user) => {
    if (!user) return null
    
    return {
      id: user._id,
      username: user.username,
      fullname: user.fullname,
      avatar: user.avatar,
      role: user.role
    }
  },

  /**
   * Chuẩn hóa danh sách users
   * @param {Array} users - Array of user objects
   * @returns {Array} Array of cleaned user data
   */
  toResponseList: (users) => {
    if (!Array.isArray(users)) return []
    return users.map(user => UserDTO.toResponse(user))
  },

  /**
   * Chuẩn hóa danh sách users public
   * @param {Array} users - Array of user objects
   * @returns {Array} Array of public user data
   */
  toPublicResponseList: (users) => {
    if (!Array.isArray(users)) return []
    return users.map(user => UserDTO.toPublicResponse(user))
  }
}
