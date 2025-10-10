import User from '../models/User.js'
import { 
  generateTokenPair, 
  refreshAccessToken, 
  revokeRefreshToken,
  revokeAllUserTokens
} from '../utils/tokenUtils.js'
import { 
  sendSuccess, 
  sendError, 
  sendCreated, 
  sendNotFound, 
  sendBadRequest,
  sendUnauthorized 
} from '../utils/responseHelper.js'
import { AuthDTO, UserDTO } from '../dto/index.js'
import { SUCCESS_MESSAGES, ERROR_MESSAGES, ERROR_CODES } from '../utils/constants.js'

const register = async (req, res, next) => {
  try {
    const { username, fullname, password, email, phone, gender, birthday } = req.body
    const newUser = new User({ username, fullname, password, email, phone, gender, birthday })
    await newUser.save()

    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress
    }
    const tokens = await generateTokenPair({ id: newUser._id, role: newUser.role }, deviceInfo)

    const responseData = AuthDTO.toLoginResponse(newUser, tokens)
    return sendCreated(res, responseData, SUCCESS_MESSAGES.REGISTER_SUCCESS)
  } catch (err) {
    next(err)
  }
}

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body
    const user = await User.findOne({ username })
    if (!user) {
      return sendBadRequest(res, ERROR_MESSAGES.INVALID_CREDENTIALS, null, ERROR_CODES.INVALID_CREDENTIALS)
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return sendBadRequest(res, ERROR_MESSAGES.INVALID_CREDENTIALS, null, ERROR_CODES.INVALID_CREDENTIALS)
    }

    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress
    }
    const tokens = await generateTokenPair({ id: user._id, role: user.role }, deviceInfo)

    const responseData = AuthDTO.toLoginResponse(user, tokens)
    return sendSuccess(res, responseData, SUCCESS_MESSAGES.LOGIN_SUCCESS)
  } catch (err) {
    next(err)
  }
}

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) {
      return sendUnauthorized(res, ERROR_MESSAGES.TOKEN_REQUIRED, ERROR_CODES.TOKEN_REQUIRED)
    }

    const result = await refreshAccessToken(refreshToken)
    const responseData = AuthDTO.toRefreshResponse(result.user, result.accessToken, result.expiresIn)
    return sendSuccess(res, responseData, SUCCESS_MESSAGES.TOKEN_REFRESH_SUCCESS)
  } catch (err) {
    next(err)
  }
}

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body
    if (refreshToken) await revokeRefreshToken(refreshToken)
    return sendSuccess(res, null, SUCCESS_MESSAGES.LOGOUT_SUCCESS)
  } catch (err) {
    next(err)
  }
}

const logoutAll = async (req, res, next) => {
  try {
    const { userId } = req.body
    if (!userId) {
      return sendBadRequest(res, ERROR_MESSAGES.REQUIRED_FIELD_MISSING, { field: 'userId' })
    }

    await revokeAllUserTokens(userId)
    return sendSuccess(res, null, SUCCESS_MESSAGES.LOGOUT_SUCCESS)
  } catch (err) {
    next(err)
  }
}

const getMe = async (req, res, next) => {
  try {
    const userId = req.user?.id
    
    if (!userId) {
      return sendBadRequest(res, ERROR_MESSAGES.REQUIRED_FIELD_MISSING, { field: 'userId' })
    }

    const user = await User.findById(userId)
    if (!user) {
      return sendNotFound(res, ERROR_MESSAGES.USER_NOT_FOUND)
    }

    const responseData = UserDTO.toResponse(user)
    return sendSuccess(res, responseData, SUCCESS_MESSAGES.USER_RETRIEVED)
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
