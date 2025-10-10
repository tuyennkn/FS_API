import mongoose from 'mongoose'

const aiStatisticSchema = new mongoose.Schema({
  title: { type: String, required: true },
  summary: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['generating', 'completed', 'failed'], 
    default: 'generating' 
  },
  
  // Phân tích đơn giản cho từng sách
  bookAnalysis: [{
    book: { type: String }, // Tên sách
    reason: { type: String }, // Lý do tại sao bán chạy
    salesCount: { type: Number },
    rating: { type: Number }
  }],
  
  // Dữ liệu đã tổng hợp sẵn cho biểu đồ (tiết kiệm token)
  chartData: {
    // Top 5 sách bán chạy nhất
    topBooks: [{
      title: { type: String },
      sales: { type: Number }
    }],
    // Phân bố theo lý do bán chạy
    reasonDistribution: [{
      reason: { type: String },
      count: { type: Number }
    }],
    // Xu hướng theo thời gian (chỉ lưu summary, không raw data)
    trends: [{
      period: { type: String }, // "week1", "week2"...
      totalSales: { type: Number },
      growth: { type: String }
    }],
    // Tương quan các yếu tố
    correlations: [{
      factor: { type: String },
      correlation: { type: Number }
    }]
  },
  
  // AI Deep Insights
  aiInsights: {
    customerInsights: { type: String }, // Phân tích tâm lý khách hàng
    marketTrends: { type: String }, // Xu hướng thị trường
    businessOpportunities: { type: String }, // Cơ hội kinh doanh
    pricingStrategy: { type: String }, // Chiến lược giá
    predictions: { type: String } // Dự đoán 3-6 tháng
  },
  
  // Kết luận chung
  conclusion: { type: String },
  
  // Gợi ý
  recommendations: [{ type: String }],
  
  // Metadata tối thiểu
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
  totalBooksAnalyzed: { type: Number }, // thay vì lưu array bookIds
  start: { type: Date, required: true },
  end: { type: Date, required: true }
}, { timestamps: true })

export default mongoose.model('AiStatistic', aiStatisticSchema)
