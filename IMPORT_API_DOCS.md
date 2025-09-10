# API Import Books Documentation

## Tổng quan
API này cho phép import dữ liệu sách từ format CSV vào hệ thống. API sẽ tự động generate embedding vector cho mỗi cuốn sách để hỗ trợ tìm kiếm semantic.

## Endpoint
```
POST /router/book/import-csv
```

## Authentication
- Requires: Bearer Token
- Role: Admin only

## Request Format

### Headers
```
Authorization: Bearer {your-admin-token}
Content-Type: application/json
```

### Body
```json
{
  "books": [
    {
      "title": "Book Title (Required)",
      "author": "Author Name (Optional)",
      "summary": "Book Description/Summary (Optional)",
      "category": "Book Genre/Category (Optional)",
      "publisher": "Publisher Name (Optional)",
      "price": "Book Price (Required)",
      "publishDate": "YYYY-MM-DD (Optional)"
    }
  ]
}
```

## CSV Data Mapping
Dựa trên CSV format của bạn:
```csv
Title,Authors,Description,Category,Publisher,Price Starting With ($),Publish Date (Month),Publish Date (Year)
```

Mapping sang JSON:
- `Title` → `title` (required)
- `Authors` → `author` (sẽ tự động loại bỏ "By " prefix)
- `Description` → `summary`
- `Category` → `category` (sẽ được lưu vào field `genre`)
- `Publisher` → `publisher`
- `Price Starting With ($)` → `price` (required, sẽ tự động parse số)
- `Publish Date (Month)` + `Publish Date (Year)` → `publishDate`

## Example Request

```json
{
  "books": [
    {
      "title": "Goat Brothers",
      "author": "Colton, Larry",
      "summary": "A compelling story about brotherhood and perseverance in challenging times",
      "category": "History, General",
      "publisher": "Doubleday",
      "price": "8.79",
      "publishDate": "1993-01-01"
    },
    {
      "title": "The Missing Person",
      "author": "Grumbach, Doris",
      "summary": "A gripping fiction about identity, loss, and the search for meaning",
      "category": "Fiction, General",
      "publisher": "Putnam Pub Group",
      "price": "4.99",
      "publishDate": "1981-03-01"
    }
  ]
}
```

## Response Format

### Success Response (201 Created)
```json
{
  "success": true,
  "message": "Successfully imported 2 books",
  "data": {
    "imported": 2,
    "total": 2,
    "errors": [],
    "books": [
      {
        "_id": "book_id_1",
        "title": "Goat Brothers",
        "author": "Colton, Larry",
        "summary": "A compelling story about brotherhood...",
        "publisher": "Doubleday",
        "price": 8.79,
        "genre": "History, General",
        "publishDate": "1993-01-01T00:00:00.000Z",
        "quantity": 1,
        "rating": 0,
        "sold": 0,
        "summaryvector": [0.1, 0.2, ...], // AI-generated embedding
        "isDisable": false,
        "createdAt": "2025-09-10T...",
        "updatedAt": "2025-09-10T..."
      }
    ]
  },
  "statusCode": 201
}
```

### Error Response (400 Bad Request)
```json
{
  "success": false,
  "message": "No books data provided",
  "statusCode": 400
}
```

### Partial Success Response
```json
{
  "success": true,
  "message": "Successfully imported 1 books",
  "data": {
    "imported": 1,
    "total": 2,
    "errors": [
      "Row 2: Title and price are required"
    ],
    "books": [...]
  },
  "statusCode": 201
}
```

## Features

### 1. Data Validation
- **Required fields**: `title`, `price`
- **Optional fields**: `author`, `summary`, `category`, `publisher`, `publishDate`
- **Data cleaning**: Tự động làm sạch dữ liệu (loại bỏ prefix "By ", parse giá...)

### 2. AI Integration
- **Embedding Generation**: Tự động generate embedding vector từ title + summary
- **Search Enhancement**: Hỗ trợ semantic search cho sách đã import

### 3. Error Handling
- **Per-row validation**: Kiểm tra từng cuốn sách riêng biệt
- **Partial import**: Cho phép import một phần nếu có lỗi
- **Detailed errors**: Báo cáo chi tiết lỗi cho từng dòng

### 4. Database Integration
- **MongoDB**: Lưu trữ vào collection Books
- **Schema compliance**: Tuân thủ Book schema có sẵn
- **Default values**: Tự động set giá trị mặc định (quantity=1, rating=0, sold=0)

## HTTP Test Example

```http
POST http://localhost:8080/router/book/import-csv
Authorization: Bearer your-admin-token
Content-Type: application/json

{
  "books": [
    {
      "title": "Sample Book",
      "author": "John Doe",
      "summary": "This is a sample book description",
      "category": "Technology",
      "publisher": "Tech Publisher",
      "price": "19.99",
      "publishDate": "2024-01-01"
    }
  ]
}
```

## Notes
- API yêu cầu quyền Admin
- Giá sẽ được parse thành số (loại bỏ ký tự $, dấu phẩy...)
- Embedding generation có thể mất vài giây cho mỗi sách
- API hỗ trợ import hàng loạt (batch import)
- Duplicate handling: Hiện tại chưa check duplicate, sẽ tạo mới tất cả
