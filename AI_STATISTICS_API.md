# 📊 AI Statistics API Documentation

## Base URL: `/api/statistics`

---

## 🔐 **Authentication Required**
- Các endpoint có 🔒 cần **Bearer Token** trong header
- Header: `Authorization: Bearer <your_access_token>`

---

## 📋 **API Endpoints**

### **1. 🚀 Tạo Báo Cáo Thống Kê**
```http
POST /api/statistics/generate
```

**🔒 Authentication Required**

**Request Body:**
```json
{
  "user_id": "user_object_id_here"
}
```

**Response Success (201):**
```json
{
  "success": true,
  "message": "✨ Đang tạo báo cáo thống kê cho bạn! Sẽ mất khoảng 1-2 phút.",
  "data": {
    "id": "report_id_here",
    "status": "generating",
    "estimatedTime": "1-2 phút",
    "period": "03/10/2025 - 02/11/2025"
  }
}
```

**Response Error (400):**
```json
{
  "success": false,
  "message": "Bạn đang có một báo cáo đang được tạo. Vui lòng đợi hoàn thành.",
  "data": { "id": "existing_report_id" }
}
```

---

### **2. 📊 Lấy Báo Cáo Theo ID**
```http
GET /api/statistics/:id
```

**Parameters:**
- `id` (string): Report ID

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "_id": "report_id",
    "title": "📊 Báo cáo phân tích sách bán chạy - 09/10/2025",
    "summary": "Phân tích 10 sách bán chạy với 3 patterns được phát hiện",
    "status": "completed",
    "bookAnalysis": [
      {
        "book": "Conan Thám Tử Lừng Danh",
        "reason": "Giá cạnh tranh + Rating cao",
        "salesCount": 150,
        "rating": 4.5
      }
    ],
    "chartData": {
      "topBooks": [
        { "title": "Conan", "sales": 150 },
        { "title": "Doraemon", "sales": 120 }
      ],
      "reasonDistribution": [
        { "reason": "Giá rẻ", "count": 5 },
        { "reason": "Rating cao", "count": 3 }
      ],
      "trends": [
        { "period": "Q1", "totalSales": 200, "growth": "0%" },
        { "period": "Q2", "totalSales": 220, "growth": "+10%" }
      ],
      "correlations": [
        { "factor": "Giá", "correlation": -0.65 },
        { "factor": "Rating", "correlation": 2.3 }
      ]
    },
    "conclusion": "Yếu tố chính ảnh hưởng đến doanh số là Giá rẻ với 50% sách thể hiện pattern này.",
    "recommendations": [
      "Xem xét chiến lược giá cạnh tranh cho sách mới",
      "Tập trung marketing cho sách có rating ≥ 4.0"
    ],
    "totalBooksAnalyzed": 10,
    "start": "2025-10-03T00:00:00.000Z",
    "end": "2025-11-02T00:00:00.000Z",
    "user_id": {
      "_id": "user_id",
      "username": "admin",
      "email": "admin@example.com"
    },
    "createdAt": "2025-10-09T10:30:00.000Z",
    "updatedAt": "2025-10-09T10:32:00.000Z"
  }
}
```

---

### **3. 📋 Lấy Danh Sách Báo Cáo**
```http
GET /api/statistics?page=1&limit=10&user_id=optional
```

**Query Parameters:**
- `page` (number, optional): Trang hiện tại (default: 1)
- `limit` (number, optional): Số lượng/trang (default: 10)
- `user_id` (string, optional): Lọc theo user

**Response Success (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "report_id_1",
      "title": "📊 Báo cáo phân tích sách bán chạy - 09/10/2025",
      "summary": "Phân tích 10 sách...",
      "status": "completed",
      "user_id": {
        "username": "admin",
        "email": "admin@example.com"
      },
      "createdAt": "2025-10-09T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

---

### **4. ⏳ Kiểm Tra Trạng Thái Báo Cáo**
```http
GET /api/statistics/:id/status
```

**Parameters:**
- `id` (string): Report ID

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "id": "report_id",
    "status": "generating",
    "progress": 45,
    "message": "🔄 Đang phân tích dữ liệu...",
    "title": "📊 Báo cáo phân tích sách bán chạy - 09/10/2025"
  }
}
```

**Status Values:**
- `generating`: Đang tạo báo cáo (progress 0-90%)
- `completed`: Hoàn thành (progress 100%)
- `failed`: Có lỗi (progress 0%)

---

### **5. 🗑️ Xóa Báo Cáo**
```http
DELETE /api/statistics/:id
```

**🔒 Authentication Required**

**Parameters:**
- `id` (string): Report ID

**Response Success (200):**
```json
{
  "success": true,
  "message": "Xóa báo cáo thành công"
}
```

---

## 🔄 **Workflow Sử Dụng**

### **Frontend Implementation Example:**

```javascript
// 1. Tạo báo cáo
const createReport = async () => {
  const response = await fetch('/api/statistics/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ user_id: userId })
  })
  
  const result = await response.json()
  return result.data.id // Report ID
}

// 2. Polling để check status
const checkStatus = async (reportId) => {
  const response = await fetch(`/api/statistics/${reportId}/status`)
  const result = await response.json()
  return result.data
}

// 3. Lấy báo cáo hoàn thành
const getReport = async (reportId) => {
  const response = await fetch(`/api/statistics/${reportId}`)
  const result = await response.json()
  return result.data
}

// 4. Workflow hoàn chỉnh
const generateReport = async () => {
  try {
    // Tạo báo cáo
    const reportId = await createReport()
    
    // Polling status mỗi 3 giây
    const interval = setInterval(async () => {
      const status = await checkStatus(reportId)
      
      // Update progress bar
      updateProgress(status.progress, status.message)
      
      if (status.status === 'completed') {
        clearInterval(interval)
        
        // Lấy báo cáo đầy đủ
        const report = await getReport(reportId)
        
        // Render charts và data
        renderReport(report)
      }
      
      if (status.status === 'failed') {
        clearInterval(interval)
        showError('Có lỗi xảy ra khi tạo báo cáo')
      }
    }, 3000)
    
  } catch (error) {
    console.error('Error:', error)
  }
}
```

---

## 📊 **Chart Data Format**

### **Top Books Chart (Bar/Column):**
```json
{
  "topBooks": [
    { "title": "Conan Tập 99", "sales": 150 },
    { "title": "Doraemon Tập 45", "sales": 120 }
  ]
}
```

### **Reason Distribution (Pie/Doughnut):**
```json
{
  "reasonDistribution": [
    { "reason": "Giá rẻ", "count": 5 },
    { "reason": "Rating cao", "count": 3 },
    { "reason": "Tác giả nổi tiếng", "count": 2 }
  ]
}
```

### **Trends Chart (Line):**
```json
{
  "trends": [
    { "period": "Q1", "totalSales": 200, "growth": "0%" },
    { "period": "Q2", "totalSales": 220, "growth": "+10.0%" },
    { "period": "Q3", "totalSales": 198, "growth": "-10.0%" },
    { "period": "Q4", "totalSales": 250, "growth": "+26.3%" }
  ]
}
```

### **Correlations Chart (Radar/Bar):**
```json
{
  "correlations": [
    { "factor": "Giá", "correlation": -0.65 },
    { "factor": "Rating", "correlation": 2.3 }
  ]
}
```

---

## ⚠️ **Error Responses**

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Access token is required"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Không tìm thấy báo cáo"
}
```

**500 Server Error:**
```json
{
  "success": false,
  "message": "Lỗi tạo báo cáo thống kê"
}
```