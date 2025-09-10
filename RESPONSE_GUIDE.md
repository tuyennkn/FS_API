# Hướng dẫn sử dụng Response Schema và Status

## 1. Import các utilities

```javascript
// Import tất cả từ utils/index.js
import {
  sendSuccess,
  sendError,
  sendCreated,
  sendNotFound,
  UserDTO,
  BookDTO,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  HTTP_STATUS
} from '../utils/index.js'

// Hoặc import riêng lẻ
import { sendSuccess } from '../utils/responseHelper.js'
import { UserDTO } from '../utils/responseSchema.js'
```

## 2. Sử dụng trong Controller

### Success Response
```javascript
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) {
      return sendNotFound(res, ERROR_MESSAGES.USER_NOT_FOUND)
    }
    
    // Chuyển dữ liệu thô từ mongo thành định dạng trả về, được định nghĩa trong file UserDTO và các method của nó. (VD: _id => id)
    const responseData = UserDTO.toResponse(user)

    // Thay vì return res.status... => sendSuccess(<biến res>, <dữ liệu trả về>, <Text trả về, lấy từ danh sách được định nghĩa sẵn>)
    return sendSuccess(res, responseData, SUCCESS_MESSAGES.USER_RETRIEVED)

  } catch (error) {
    // 
    return sendError(res, ERROR_MESSAGES.INTERNAL_ERROR, 500, { message: error.message })
  }
}
```

### Created Response
```javascript
const createUser = async (req, res) => {
  try {
    const user = new User(req.body)
    await user.save()
    
    const responseData = UserDTO.toResponse(user)
    return sendCreated(res, responseData, SUCCESS_MESSAGES.USER_CREATED)
  } catch (error) {
    return sendError(res, ERROR_MESSAGES.INTERNAL_ERROR, 500, { message: error.message })
  }
}
```

### Paginated Response
```javascript
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit
    
    const users = await User.find().skip(skip).limit(limit)
    const total = await User.countDocuments()
    
    const responseData = UserDTO.toResponseList(users)
    return sendPaginated(res, responseData, page, limit, total, SUCCESS_MESSAGES.USER_RETRIEVED)
  } catch (error) {
    return sendError(res, ERROR_MESSAGES.INTERNAL_ERROR, 500, { message: error.message })
  }
}
```

## 3. Response Format

### Success Response
```json
{
  "success": true,
  "message": "Success message",
  "data": {...},
  "timestamp": "2025-09-09T10:30:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": {...},
  "code": "ERROR_CODE",
  "timestamp": "2025-09-09T10:30:00.000Z"
}
```

### Paginated Response
```json
{
  "success": true,
  "message": "Success message",
  "data": [...],
  "meta": {
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalItems": 100,
      "itemsPerPage": 10,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "timestamp": "2025-09-09T10:30:00.000Z"
}
```

## 4. Error Handling với Middleware

### Setup trong app.js
```javascript
import { errorHandler, notFoundHandler } from './src/utils/index.js'

// ... other middlewares

// 404 handler
app.use(notFoundHandler)

// Global error handler
app.use(errorHandler)
```

### Sử dụng asyncHandler
```javascript
import { asyncHandler } from '../utils/index.js'

const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
  if (!user) {
    return sendNotFound(res, ERROR_MESSAGES.USER_NOT_FOUND)
  }
  
  const responseData = UserDTO.toResponse(user)
  return sendSuccess(res, responseData, SUCCESS_MESSAGES.USER_RETRIEVED)
})
```

## 5. Validation với Middleware

```javascript
import { validateRequest } from '../utils/index.js'
import Joi from 'joi'

const createUserSchema = Joi.object({
  username: Joi.string().min(3).max(20).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
})

router.post('/users', validateRequest(createUserSchema), createUser)
```

## 6. Custom DTO

```javascript
// Tạo DTO tùy chỉnh
export const CustomDTO = {
  toResponse: (data) => {
    return {
      id: data._id,
      customField: data.someField,
      // ... other fields
    }
  },
  
  toResponseList: (dataList) => {
    return dataList.map(item => CustomDTO.toResponse(item))
  }
}
```

## 7. Best Practices

1. **Luôn sử dụng DTO** để chuẩn hóa dữ liệu trả về
2. **Sử dụng constants** cho messages và error codes
3. **Consistent error handling** với middleware
4. **Validate input** với validation middleware
5. **Log errors** cho debugging
6. **Return early** để tránh nested code

## 8. Migration từ code cũ

### Trước:
```javascript
res.status(200).json({ message: 'Success', data: user })
```

### Sau:
```javascript
return sendSuccess(res, UserDTO.toResponse(user), SUCCESS_MESSAGES.USER_RETRIEVED)
```
