    import { verifyAccessToken } from '../utils/tokenUtils.js'
    import User from '../models/User.js'

    // Middleware xác thực access token
    export const authenticateToken = async (req, res, next) => {
        try {
            const authHeader = req.headers['authorization']
            const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

            if (!token) {
                return res.status(401).json({ 
                    message: 'Access token required',
                    code: 'TOKEN_REQUIRED'
                })
            }

            const decoded = verifyAccessToken(token)
            if (!decoded) {
                return res.status(401).json({ 
                    message: 'Invalid or expired access token',
                    code: 'TOKEN_INVALID'
                })
            }

            // Lấy thông tin user
            const user = await User.findById(decoded.id).select('-password')
            if (!user) {
                return res.status(401).json({ 
                    message: 'User not found',
                    code: 'USER_NOT_FOUND'
                })
            }

            req.user = user
            next()
        } catch (error) {
            return res.status(500).json({ 
                message: 'Token verification failed',
                error: error.message 
            })
        }
    }

    // Middleware xác thực token tùy chọn (không bắt buộc)
    export const optionalAuth = async (req, res, next) => {
        try {
            const authHeader = req.headers['authorization']
            const token = authHeader && authHeader.split(' ')[1]

            if (token) {
                const decoded = verifyAccessToken(token)
                if (decoded) {
                    const user = await User.findById(decoded.id).select('-password')
                    req.user = user
                }
            }
            
            next()
        } catch (error) {
            // Nếu có lỗi, vẫn tiếp tục mà không set user
            next()
        }
    }
