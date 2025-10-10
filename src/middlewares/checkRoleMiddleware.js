// Middleware kiểm tra role
export const checkRole = (requiredRoles) => {
  return (req, res, next) => {
    try {
      // Giả sử bạn đã decode JWT và gắn user vào req.user
      const user = req.user

      if (!user) {
        return res.status(401).json({ message: 'Chưa xác thực người dùng' })
      }

      // Support both string and array of roles
      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      
      if (!roles.includes(user.role)) {
        return res.status(403).json({ message: 'Không có quyền truy cập' })
      }

      next() // hợp lệ -> đi tiếp controller
    } catch (err) {
      return res.status(500).json({ message: 'Lỗi server', error: err.message })
    }
  }
}
