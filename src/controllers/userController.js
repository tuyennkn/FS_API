import { userService } from '~/services/userService'
import { 
  sendSuccess, 
  sendError, 
  sendCreated 
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

export const userController = {
  createUser
}
