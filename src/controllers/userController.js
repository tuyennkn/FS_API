import { userService } from '../services/userService.js'
import {
  sendSuccess,
  sendError,
  sendCreated,
  sendPaginated
} from '../utils/responseHelper.js'
import { UserDTO } from '../dto/index.js'
import { SUCCESS_MESSAGES } from '../utils/constants.js'

const createUser = async (req, res, next) => {
  try {
    console.log('📥 req.body:', req.body)

    const createdUser = await userService.createUser(req.body)
    const responseData = UserDTO.toResponse(createdUser)

    return sendCreated(res, responseData, SUCCESS_MESSAGES.USER_CREATED)
  } catch (error) {
    console.error('❌ Lỗi rồi nè:', error)
    return sendError(res, 'Tạo người dùng thất bại', 500, { message: error.message })
  }
}

const getUser = async (req, res, next) => {
  try {
    const userId = req.params.id
    console.log('📥 req.params:', req.params)

    const user = await userService.getUserById(userId)
    if (!user) {
      return sendError(res, 'Người dùng không tồn tại', 404)
    }

    const responseData = UserDTO.toResponse(user)
    return sendSuccess(res, responseData)
  } catch (error) {
    console.error('❌ Lỗi rồi nè:', error)
    return sendError(res, 'Lấy thông tin người dùng thất bại', 500, { message: error.message })
  }
}


const updateUser = async (req, res, next) => {
  try {
    const userId = req.params.id

    // check if current user is admin or the user himself
    const currentUser = req.user
    if (currentUser.role !== 'admin' && currentUser.id !== userId) {
      return sendError(res, 'Bạn không có quyền cập nhật người dùng này', 403)
    }
    const updatedUser = await userService.updateUser(userId, req.body)
    if (!updatedUser) {
      return sendError(res, 'Người dùng không tồn tại', 404)
    }
    const responseData = UserDTO.toResponse(updatedUser)
    console.log('Updated user:', responseData)
    return sendSuccess(res, responseData, SUCCESS_MESSAGES.USER_UPDATED)
  } catch (error) {
    console.error('❌ Lỗi rồi nè:', error)
    return sendError(res, 'Cập nhật người dùng thất bại', 500, { message: error.message })
  }
}

const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    
    console.log('📥 Getting all users with params:', { page, limit, search });

    const result = await userService.getAllUsers(page, limit, search);
    
    const responseData = result.users.map(user => UserDTO.toResponse(user));
    
    return sendPaginated(res, responseData, page, limit, result.total, SUCCESS_MESSAGES.DATA_RETRIEVED);
  } catch (error) {
    console.error('❌ Lỗi lấy danh sách users:', error);
    return sendError(res, 'Lấy danh sách người dùng thất bại', 500, { message: error.message });
  }
}

export const userController = {
  createUser,
  getUser,
  updateUser,
  getAllUsers
}
