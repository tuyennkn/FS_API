import  { userService }  from '~/services/userService'

const createUser = async (req, res, next) => {
  try {
    console.log('📥 req.body:', req.body)
    
    const createdUser = await userService.createUser(req.body)
    
    // ✅ Phải trả kết quả về client
    res.status(201).json({
      message: 'Tạo người dùng thành công',
      data: createdUser
    })
  } catch (error) {
    console.error('❌ Lỗi rồi nè:', error)
    res.status(500).json({
      message: 'Tạo người dùng thất bại',
      error: error.message
    })
  }
}

export const userController = {
  createUser
}
