import User from '../models/User.js'
import { 
  generateTokenPair, 
  refreshAccessToken, 
  revokeRefreshToken,
  revokeAllUserTokens
} from '../utils/tokenUtils.js'

const register = async (req, res, next) => {
  try {
    const { username, fullname, password, email, phone, gender, birthday, avatar, persona, address } = req.body
    const newUser = new User({ username, fullname, password, email, phone, gender, birthday, avatar, persona, address })
    await newUser.save()

    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress
    }
    const tokens = await generateTokenPair({ id: newUser._id, role: newUser.role }, deviceInfo)

    res.json({ message: 'Register success', ...tokens, user: newUser })
  } catch (err) {
    next(err)
  }
}

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body
    const user = await User.findOne({ username })
    if (!user) return res.status(400).json({ message: 'Invalid username or password' })

    const isMatch = await user.comparePassword(password)
    if (!isMatch) return res.status(400).json({ message: 'Invalid username or password' })

    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress
    }
    const tokens = await generateTokenPair({ id: user._id, role: user.role }, deviceInfo)

    res.json({ message: 'Login success', ...tokens, user })
  } catch (err) {
    next(err)
  }
}

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) return res.status(401).json({ message: 'Refresh token required' })

    const result = await refreshAccessToken(refreshToken)
    res.json({
      message: 'Token refreshed successfully',
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
      user: result.user
    })
  } catch (err) {
    next(err)
  }
}

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body
    if (refreshToken) await revokeRefreshToken(refreshToken)
    res.json({ message: 'Logged out successfully' })
  } catch (err) {
    next(err)
  }
}

const logoutAll = async (req, res, next) => {
  try {
    const { userId } = req.body
    if (!userId) return res.status(400).json({ message: 'userId required' })

    await revokeAllUserTokens(userId)
    res.json({ message: 'Logged out from all devices successfully' })
  } catch (err) {
    next(err)
  }
}

const getMe = async (req, res, next) => {
  try {
    const { userId } = req.query
    if (!userId) return res.status(400).json({ message: 'userId required' })

    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ message: 'User not found' })

    res.json({ user })
  } catch (err) {
    next(err)
  }
}

export const authController = {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  getMe
}
