# DTO Documentation

## 📁 Cấu trúc thư mục DTO

```
src/dto/
├── index.js          # Export tất cả DTOs
├── UserDTO.js        # User Data Transfer Object
├── BookDTO.js        # Book Data Transfer Object  
├── CategoryDTO.js    # Category Data Transfer Object
├── CommentDTO.js     # Comment Data Transfer Object
├── OrderDTO.js       # Order Data Transfer Object
└── AuthDTO.js        # Authentication Data Transfer Object
```

## 🎯 Lợi ích của việc tách DTO

1. **Modular**: Mỗi DTO trong file riêng, dễ maintain
2. **Reusable**: Có thể import chỉ DTO cần thiết
3. **Scalable**: Dễ thêm methods mới cho từng DTO
4. **Type Safety**: Mỗi DTO có các methods cụ thể
5. **Clean Code**: Code rõ ràng, dễ đọc

## 📖 Cách sử dụng

### Import DTOs

```javascript
// Import tất cả DTOs
import { UserDTO, BookDTO, CategoryDTO } from '../dto/index.js'

// Import DTO riêng lẻ
import { UserDTO } from '../dto/UserDTO.js'
import { BookDTO } from '../dto/BookDTO.js'

// Import default (tất cả DTOs)
import DTOs from '../dto/index.js'
const { UserDTO, BookDTO } = DTOs
```

### Sử dụng trong Controller

```javascript
import { UserDTO, BookDTO } from '../dto/index.js'

const getUser = async (req, res) => {
  const user = await User.findById(req.params.id)
  
  // Sử dụng method cơ bản
  const response = UserDTO.toResponse(user)
  
  // Sử dụng method public (ít thông tin hơn)
  const publicResponse = UserDTO.toPublicResponse(user)
  
  return sendSuccess(res, response)
}
```

## 📋 Các Methods có sẵn

### UserDTO

- `toResponse(user)` - Full user info
- `toPublicResponse(user)` - Public user info (ẩn thông tin nhạy cảm)
- `toResponseList(users)` - List full user info
- `toPublicResponseList(users)` - List public user info

### BookDTO

- `toResponse(book)` - Full book info
- `toResponseWithCategory(book)` - Book with populated category
- `toListResponse(book)` - Simplified book info for lists
- `toResponseList(books)` - List full book info
- `toListResponseList(books)` - List simplified book info

### CategoryDTO

- `toResponse(category)` - Full category info
- `toListResponse(category)` - Simplified category info
- `toSelectResponse(category)` - Category for dropdown/select
- `toResponseList(categories)` - List full category info
- `toListResponseList(categories)` - List simplified category info
- `toSelectResponseList(categories)` - List for dropdown

### CommentDTO

- `toResponse(comment)` - Basic comment info
- `toResponseWithPopulated(comment)` - Comment with user/book populated
- `toListResponse(comment)` - Simplified comment for lists
- `toResponseList(comments)` - List basic comments
- `toResponseListWithPopulated(comments)` - List with populated data
- `toListResponseList(comments)` - List simplified comments

### OrderDTO

- `toResponse(order)` - Basic order info
- `toResponseWithPopulated(order)` - Order with user/books populated
- `toListResponse(order)` - Simplified order for lists
- `toResponseList(orders)` - List basic orders
- `toResponseListWithPopulated(orders)` - List with populated data
- `toListResponseList(orders)` - List simplified orders

### AuthDTO

- `toLoginResponse(user, tokens)` - Login/Register response
- `toRefreshResponse(user, accessToken, expiresIn)` - Refresh token response
- `toRegisterResponse(user, tokens)` - Register response
- `toProfileResponse(user)` - Profile response

## ✨ Ví dụ sử dụng

### 1. User Controller

```javascript
import { UserDTO } from '../dto/index.js'

// Lấy thông tin user đầy đủ
const getUser = async (req, res) => {
  const user = await User.findById(req.params.id)
  const response = UserDTO.toResponse(user)
  return sendSuccess(res, response)
}

// Lấy thông tin user public
const getUserPublic = async (req, res) => {
  const user = await User.findById(req.params.id)
  const response = UserDTO.toPublicResponse(user)
  return sendSuccess(res, response)
}
```

### 2. Book Controller với Category

```javascript
import { BookDTO } from '../dto/index.js'

// Book với category populated
const getBookWithCategory = async (req, res) => {
  const book = await Book.findById(req.params.id).populate('category')
  const response = BookDTO.toResponseWithCategory(book)
  return sendSuccess(res, response)
}

// List books đơn giản
const getBooksList = async (req, res) => {
  const books = await Book.find()
  const response = BookDTO.toListResponseList(books)
  return sendSuccess(res, response)
}
```

### 3. Category cho Dropdown

```javascript
import { CategoryDTO } from '../dto/index.js'

const getCategoriesForSelect = async (req, res) => {
  const categories = await Category.find({ isDisable: false })
  const response = CategoryDTO.toSelectResponseList(categories)
  return sendSuccess(res, response)
}
```

### 4. Comment với User/Book populated

```javascript
import { CommentDTO } from '../dto/index.js'

const getCommentsForBook = async (req, res) => {
  const comments = await Comment.find({ book_id: req.params.bookId })
    .populate('user_id', 'username avatar')
    .populate('book_id', 'title author')
  
  const response = CommentDTO.toResponseListWithPopulated(comments)
  return sendSuccess(res, response)
}
```

## 🚀 Migration từ responseSchema.js

### Trước (responseSchema.js):
```javascript
import { UserDTO, BookDTO } from '../utils/responseSchema.js'
```

### Sau (dto/):
```javascript
import { UserDTO, BookDTO } from '../dto/index.js'
```

## 📝 Thêm DTO mới

1. Tạo file mới trong `src/dto/`
2. Export DTO trong `src/dto/index.js`
3. Sử dụng trong controller

```javascript
// src/dto/NewModelDTO.js
export const NewModelDTO = {
  toResponse: (data) => {
    // Transform logic
  }
}

// src/dto/index.js
export { NewModelDTO } from './NewModelDTO.js'
```

## 🎯 Best Practices

1. **Sử dụng method phù hợp**: `toResponse` cho detail, `toListResponse` cho list
2. **Populated data**: Sử dụng `WithPopulated` methods khi có populate
3. **Public data**: Sử dụng `Public` methods cho API public
4. **Consistency**: Giữ naming convention nhất quán
5. **Documentation**: Comment rõ ràng cho từng method
