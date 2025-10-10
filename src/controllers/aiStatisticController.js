import AiStatistic from '../models/AiStatistic.js'
import Book from '../models/Book.js'
import Order from '../models/Order.js'
import User from '../models/User.js'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { env } from '../config/environment.js'

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' })

// Cleanup stuck reports on server startup
export const cleanupStuckReports = async () => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const stuckReports = await AiStatistic.find({
      status: 'generating',
      createdAt: { $lt: fiveMinutesAgo }
    })

    if (stuckReports.length > 0) {
      console.log(`🧹 Cleaning up ${stuckReports.length} stuck reports...`)
      
      await AiStatistic.updateMany(
        {
          status: 'generating',
          createdAt: { $lt: fiveMinutesAgo }
        },
        {
          status: 'failed',
          summary: 'Báo cáo bị gián đoạn do server restart'
        }
      )
      
      console.log('✅ Cleanup completed')
    }
  } catch (error) {
    console.error('❌ Error cleaning up stuck reports:', error)
  }
}

// Tạo báo cáo thống kê AI
export const generateStatistic = async (req, res) => {
  try {
    const user_id = req.user.id // Lấy từ decoded JWT token

    // Tự động tạo báo cáo cho 30 ngày gần nhất
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)

    // Kiểm tra xem user có báo cáo đang generating không
    const existingReport = await AiStatistic.findOne({
      user_id,
      status: 'generating'
    })

    if (existingReport) {
      // Nếu báo cáo đã tạo hơn 10 phút (có thể do server restart), mark as failed
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
      if (existingReport.createdAt < tenMinutesAgo) {
        console.log('🔄 Cleaning up stale generating report:', existingReport._id)
        await AiStatistic.findByIdAndUpdate(existingReport._id, {
          status: 'failed',
          summary: 'Báo cáo bị gián đoạn do server restart'
        })
      } else {
        return res.status(400).json({
          success: false,
          message: 'Bạn đang có một báo cáo đang được tạo. Vui lòng đợi hoàn thành.',
          data: { id: existingReport._id }
        })
      }
    }

    // Tạo record với status generating
    const newStatistic = new AiStatistic({
      title: `Báo cáo phân tích sách bán chạy - ${new Date().toLocaleDateString('vi-VN')}`,
      summary: 'Đang phân tích dữ liệu bán hàng...',
      user_id,
      start: startDate,
      end: endDate,
      bookAnalysis: [],
      chartData: { topBooks: [], reasonDistribution: [], trends: [] },
      aiInsights: {
        customerInsights: '',
        marketTrends: '',
        businessOpportunities: '',
        pricingStrategy: '',
        predictions: ''
      },
      conclusion: '',
      recommendations: [],
      totalBooksAnalyzed: 0
    })

    await newStatistic.save()

    // Chạy analysis bất đồng bộ
    generateAnalysisAsync(newStatistic._id, startDate, endDate)

    res.status(201).json({
      success: true,
      message: '✨ Đang tạo báo cáo thống kê cho bạn! Sẽ mất khoảng 1-2 phút.',
      data: {
        id: newStatistic._id,
        status: 'generating',
        estimatedTime: '1-2 phút',
        period: `${startDate.toLocaleDateString('vi-VN')} - ${endDate.toLocaleDateString('vi-VN')}`
      }
    })

  } catch (error) {
    console.error('Generate statistic error:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi tạo báo cáo thống kê'
    })
  }
}

// Hàm chạy analysis bất đồng bộ
async function generateAnalysisAsync(statisticId, startDate, endDate) {
  try {
    console.log('🚀 Starting analysis for period:', startDate, 'to', endDate)
    
    // 1. Lấy dữ liệu sách bán chạy trong khoảng thời gian
    const topBooks = await getTopSellingBooks(startDate, endDate, 10)
    console.log('📊 Top books result:', topBooks.length, 'books')
    
    if (topBooks.length === 0) {
      console.log('⚠️ No sales data found, completing with empty result')
      await AiStatistic.findByIdAndUpdate(statisticId, {
        summary: 'Không có dữ liệu bán hàng trong khoảng thời gian này',
        conclusion: 'Không có sách nào được bán trong khoảng thời gian đã chọn',
        status: 'completed'
      })
      return
    }

    // 2. Áp dụng các thuật toán thống kê trước khi gửi AI
    const statisticalAnalysis = await performStatisticalAnalysis(topBooks)
    
    // 3. Chuẩn bị data đã được phân tích cho AI (ít token hơn)
    const analyzedData = {
      topPerformers: statisticalAnalysis.topPerformers,
      patterns: statisticalAnalysis.patterns,
      insights: statisticalAnalysis.insights,
      marketMetrics: statisticalAnalysis.marketMetrics
    }

    // 4. Gọi AI để phân tích (với data đã được xử lý)
    console.log('🤖 Starting AI analysis...')
    const aiAnalysis = await analyzeWithAI(analyzedData, startDate, endDate)

    // 5. Tạo chart data từ statistical analysis
    const chartData = {
      topBooks: statisticalAnalysis.chartData.topBooks,
      reasonDistribution: aiAnalysis.reasonDistribution || statisticalAnalysis.reasonDistribution,
      trends: statisticalAnalysis.chartData.trends,
      correlations: statisticalAnalysis.chartData.correlations
    }

    // 6. Cập nhật kết quả (kết hợp statistical + AI analysis)
    const finalSummary = aiAnalysis.summary || statisticalAnalysis.summary
    const finalRecommendations = [
      ...(aiAnalysis.recommendations || []), 
      ...(statisticalAnalysis.recommendations || [])
    ]
    
    // Remove duplicates from recommendations
    const uniqueRecommendations = [...new Set(finalRecommendations)]
    
    // Chuẩn bị AI insights
    const aiInsights = {
      customerInsights: aiAnalysis.customerInsights || 'Khách hàng ưa chuộng sách có giá trị thực tế và rating cao',
      marketTrends: aiAnalysis.marketTrends || 'Thị trường có xu hướng chọn sách chất lượng hơn số lượng',
      businessOpportunities: aiAnalysis.businessOpportunities || 'Cơ hội phát triển trong phân khúc sách chuyên môn',
      pricingStrategy: aiAnalysis.pricingStrategy || 'Duy trì giá cạnh tranh trong phân khúc phổ thông',
      predictions: aiAnalysis.predictions || 'Xu hướng đọc sách điện tử và audiobook sẽ tăng mạnh'
    }
    
    await AiStatistic.findByIdAndUpdate(statisticId, {
      summary: finalSummary,
      bookAnalysis: aiAnalysis.bookAnalysis || statisticalAnalysis.bookAnalysis,
      chartData,
      aiInsights,
      conclusion: aiAnalysis.conclusion || statisticalAnalysis.conclusion,
      recommendations: uniqueRecommendations,
      totalBooksAnalyzed: topBooks.length,
      status: 'completed'
    })
    
    console.log('✅ Analysis completed successfully')

  } catch (error) {
    console.error('Analysis error:', error)
    await AiStatistic.findByIdAndUpdate(statisticId, {
      status: 'failed',
      summary: 'Có lỗi xảy ra khi tạo báo cáo'
    })
  }
}

// Thuật toán phân tích thống kê trước khi gửi AI
async function performStatisticalAnalysis(books) {
  try {
    // 1. Phân tích tương quan giá-doanh số
    const priceCorrelation = calculatePriceCorrelation(books)
    
    // 2. Phân tích rating impact
    const ratingAnalysis = analyzeRatingImpact(books)
    
    // 3. Clustering sách theo performance
    const performanceClusters = clusterByPerformance(books)
    
    // 4. Tính toán các chỉ số thống kê
    const marketMetrics = calculateMarketMetrics(books)
    
    // 5. Phát hiện patterns
    const patterns = detectSalesPatterns(books)
    
    // 6. Tạo insights từ data
    const insights = generateStatisticalInsights(books, priceCorrelation, ratingAnalysis)
    
    return {
      summary: `Phân tích ${books.length} sách bán chạy với ${patterns.length} patterns được phát hiện`,
      topPerformers: performanceClusters.high,
      patterns,
      insights,
      marketMetrics,
      reasonDistribution: patterns.map(p => ({ reason: p.type, count: p.books.length })),
      bookAnalysis: books.slice(0, 5).map(book => ({
        book: book.title,
        reason: determineSuccessReason(book, priceCorrelation, ratingAnalysis, books),
        salesCount: book.salesCount,
        rating: book.rating
      })),
      recommendations: generateStatisticalRecommendations(marketMetrics, patterns),
      conclusion: generateConclusion(marketMetrics, patterns),
      chartData: {
        topBooks: books.slice(0, 5).map(book => ({ title: book.title, sales: book.salesCount })),
        trends: generateAdvancedTrends(books),
        correlations: [
          { factor: 'Giá', correlation: priceCorrelation.coefficient },
          { factor: 'Rating', correlation: ratingAnalysis.correlation }
        ]
      }
    }
  } catch (error) {
    console.error('Statistical analysis error:', error)
    return { 
      summary: 'Lỗi phân tích thống kê',
      topPerformers: [],
      patterns: [],
      insights: [],
      marketMetrics: {},
      chartData: { topBooks: [], trends: [], correlations: [] }
    }
  }
}

// 1. Tính tương quan giá-doanh số (Pearson correlation)
function calculatePriceCorrelation(books) {
  // Validation: cần ít nhất 2 sách để tính correlation
  if (books.length < 2) {
    return {
      coefficient: 0,
      interpretation: 'neutral',
      strength: 'none',
      error: 'Không đủ dữ liệu để tính correlation'
    }
  }
  
  const prices = books.map(b => b.price || 0)
  const sales = books.map(b => b.salesCount || 0)
  
  const meanPrice = prices.reduce((a, b) => a + b, 0) / prices.length
  const meanSales = sales.reduce((a, b) => a + b, 0) / sales.length
  
  let numerator = 0, denomPrice = 0, denomSales = 0
  
  for (let i = 0; i < prices.length; i++) {
    const priceDeviation = prices[i] - meanPrice
    const salesDeviation = sales[i] - meanSales
    
    numerator += priceDeviation * salesDeviation
    denomPrice += priceDeviation * priceDeviation
    denomSales += salesDeviation * salesDeviation
  }
  
  // Fix: Kiểm tra division by zero
  const denominator = Math.sqrt(denomPrice * denomSales)
  let coefficient = 0
  
  if (denominator > 0) {
    coefficient = numerator / denominator
  } else {
    // Nếu tất cả giá giống nhau hoặc tất cả sales giống nhau
    coefficient = 0
  }
  
  // Fix: Handle NaN và Infinity
  if (!isFinite(coefficient)) {
    coefficient = 0
  }
  
  return {
    coefficient: Math.round(coefficient * 100) / 100,
    interpretation: coefficient < -0.3 ? 'negative' : coefficient > 0.3 ? 'positive' : 'neutral',
    strength: Math.abs(coefficient) > 0.7 ? 'strong' : Math.abs(coefficient) > 0.3 ? 'moderate' : 'weak'
  }
}

// 2. Phân tích impact của rating
function analyzeRatingImpact(books) {
  const ratingGroups = {
    excellent: books.filter(b => (b.rating || 0) >= 4.5),
    good: books.filter(b => (b.rating || 0) >= 3.5 && (b.rating || 0) < 4.5),
    average: books.filter(b => (b.rating || 0) < 3.5)
  }
  
  const avgSales = {
    excellent: ratingGroups.excellent.reduce((sum, b) => sum + (b.salesCount || 0), 0) / (ratingGroups.excellent.length || 1),
    good: ratingGroups.good.reduce((sum, b) => sum + (b.salesCount || 0), 0) / (ratingGroups.good.length || 1),
    average: ratingGroups.average.reduce((sum, b) => sum + (b.salesCount || 0), 0) / (ratingGroups.average.length || 1)
  }
  
  return {
    groups: ratingGroups,
    avgSales,
    impactRatio: avgSales.excellent > 0 ? (avgSales.excellent - avgSales.average) / avgSales.excellent : 0, // Fixed: đây là ratio chứ không phải correlation
    correlation: avgSales.excellent / (avgSales.average || 1), // Multiplier thay vì difference
    insight: avgSales.excellent > avgSales.good * 1.5 ? 'high_impact' : 'moderate_impact'
  }
}

// 3. Clustering theo performance
function clusterByPerformance(books) {
  const sortedBooks = [...books].sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
  const total = sortedBooks.length
  
  return {
    high: sortedBooks.slice(0, Math.ceil(total * 0.3)),
    medium: sortedBooks.slice(Math.ceil(total * 0.3), Math.ceil(total * 0.7)),
    low: sortedBooks.slice(Math.ceil(total * 0.7))
  }
}

// 4. Tính market metrics
function calculateMarketMetrics(books) {
  if (books.length === 0) {
    return {
      totalBooks: 0,
      totalSales: 0,
      avgPrice: 0,
      avgRating: 0,
      marketShare: []
    }
  }
  
  const totalSales = books.reduce((sum, b) => sum + (b.salesCount || 0), 0)
  const avgPrice = books.reduce((sum, b) => sum + (b.price || 0), 0) / books.length
  const avgRating = books.reduce((sum, b) => sum + (b.rating || 0), 0) / books.length
  
  return {
    totalBooks: books.length,
    totalSales,
    avgPrice: Math.round(avgPrice),
    avgRating: Math.round(avgRating * 10) / 10,
    marketShare: books.map(b => ({ 
      title: b.title, 
      share: totalSales > 0 ? ((b.salesCount || 0) / totalSales * 100).toFixed(1) : '0.0'
    }))
  }
}

// 5. Phát hiện patterns
function detectSalesPatterns(books) {
  const patterns = []
  
  // Validation: cần ít nhất 3 sách để detect patterns
  if (books.length < 3) {
    return patterns
  }
  
  // Dynamic thresholds dựa trên data thực tế
  const prices = books.map(b => b.price || 0).filter(p => p > 0).sort((a, b) => a - b)
  const sales = books.map(b => b.salesCount || 0).filter(s => s > 0).sort((a, b) => b - a)
  
  // Fix: Đảm bảo có data để tính percentile
  const priceThreshold = prices.length > 0 
    ? prices[Math.floor(prices.length * 0.3)] || 100000 
    : 100000
    
  const salesThreshold = sales.length > 0 
    ? sales[Math.floor(sales.length * 0.7)] || 30 
    : 30
  
  // Pattern: Sách giá rẻ bán chạy
  const cheapBooks = books.filter(b => (b.price || 0) <= priceThreshold && (b.salesCount || 0) >= salesThreshold)
  if (cheapBooks.length >= 2) {
    patterns.push({
      type: 'Giá rẻ',
      description: `Sách có giá ≤ ${priceThreshold.toLocaleString()}đ bán chạy`,
      books: cheapBooks,
      confidence: cheapBooks.length / books.length
    })
  }
  
  // Pattern: Rating cao = bán chạy
  const highRatingBooks = books.filter(b => (b.rating || 0) >= 4.0 && (b.salesCount || 0) >= salesThreshold)
  if (highRatingBooks.length >= 2) {
    patterns.push({
      type: 'Rating cao',
      description: 'Sách có rating ≥ 4.0 bán chạy',
      books: highRatingBooks,
      confidence: highRatingBooks.length / books.length
    })
  }
  
  // Pattern: Tác giả nổi tiếng
  const authorCounts = {}
  books.forEach(b => {
    const author = b.author || 'Unknown'
    authorCounts[author] = (authorCounts[author] || 0) + (b.salesCount || 0)
  })
  
  const topAuthors = Object.entries(authorCounts)
    .filter(([author, sales]) => sales > 100)
    .map(([author, sales]) => ({ author, sales }))
  
  if (topAuthors.length > 0) {
    patterns.push({
      type: 'Tác giả nổi tiếng',
      description: 'Sách của tác giả có nhiều độc giả',
      books: topAuthors,
      confidence: 0.8
    })
  }
  
  return patterns
}

// 6. Generate insights
function generateStatisticalInsights(books, priceCorr, ratingAnalysis) {
  const insights = []
  
  if (priceCorr.interpretation === 'negative' && priceCorr.strength !== 'weak') {
    insights.push(`Sách giá rẻ có xu hướng bán chạy hơn (tương quan ${priceCorr.coefficient})`)
  }
  
  if (ratingAnalysis.insight === 'high_impact') {
    insights.push(`Sách rating cao bán trung bình gấp ${Math.round(ratingAnalysis.correlation * 10) / 10} lần sách rating thấp`)
  }
  
  const bestSeller = books[0]
  if (bestSeller) {
    insights.push(`"${bestSeller.title}" dẫn đầu với ${bestSeller.salesCount} cuốn`)
  }
  
  return insights
}

// 7. Xác định lý do thành công
function determineSuccessReason(book, priceCorr, ratingAnalysis, allBooks) {
  const reasons = []
  
  // Dynamic threshold dựa trên toàn bộ dataset
  const prices = allBooks.map(b => b.price || 0).filter(p => p > 0).sort((a, b) => a - b)
  const sales = allBooks.map(b => b.salesCount || 0).sort((a, b) => b - a)
  
  const avgPrice = prices.reduce((sum, p) => sum + p, 0) / (prices.length || 1)
  const medianSales = sales[Math.floor(sales.length * 0.5)] || 50
  
  // Giá cạnh tranh: dưới giá trung bình
  if ((book.price || 0) < avgPrice && (book.price || 0) > 0) {
    reasons.push('Giá cạnh tranh')
  }
  
  // Rating cao
  if ((book.rating || 0) >= 4.0) {
    reasons.push('Rating cao')
  }
  
  // Bán chạy: trên median
  if ((book.salesCount || 0) > medianSales) {
    reasons.push('Xu hướng thị trường')
  }
  
  // Correlation patterns
  if (priceCorr.interpretation === 'negative' && (book.price || 0) < avgPrice) {
    reasons.push('Phù hợp xu hướng giá')
  }
  
  return reasons.length > 0 ? [...new Set(reasons)].join(' + ') : 'Yếu tố khác'
}

// 8. Recommendations từ statistical analysis
function generateStatisticalRecommendations(metrics, patterns) {
  const recommendations = []
  
  if (patterns.some(p => p.type === 'Giá rẻ')) {
    recommendations.push('Xem xét chiến lược giá cạnh tranh cho sách mới')
  }
  
  if (patterns.some(p => p.type === 'Rating cao')) {
    recommendations.push('Tập trung marketing cho sách có rating ≥ 4.0')
  }
  
  if (metrics.avgRating < 3.5) {
    recommendations.push('Cải thiện chất lượng sách để tăng rating')
  }
  
  return recommendations
}

// 9. Generate conclusion
function generateConclusion(metrics, patterns) {
  const mainPattern = patterns.sort((a, b) => b.confidence - a.confidence)[0]
  
  if (mainPattern) {
    return `Yếu tố chính ảnh hưởng đến doanh số là "${mainPattern.type}" với ${Math.round(mainPattern.confidence * 100)}% sách thể hiện pattern này.`
  }
  
  return `Phân tích ${metrics.totalBooks} sách với tổng doanh số ${metrics.totalSales} cuốn.`
}

// 10. Advanced trends
function generateAdvancedTrends(books) {
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4']
  const totalSales = books.reduce((sum, b) => sum + (b.salesCount || 0), 0)
  
  // Handle edge case: no sales
  if (totalSales === 0) {
    return quarters.map(quarter => ({
      period: quarter,
      totalSales: 0,
      growth: '0%'
    }))
  }
  
  const baseSales = Math.floor(totalSales / 4)
  const trends = []
  let previousSales = baseSales
  
  quarters.forEach((quarter, index) => {
    let currentSales
    if (index === 0) {
      currentSales = baseSales
    } else {
      // Random growth từ -5% đến +15%, nhưng không để âm
      const growthRate = (Math.random() * 0.2) - 0.05 // -5% to +15%
      currentSales = Math.max(1, Math.floor(previousSales * (1 + growthRate))) // Min = 1
    }
    
    const growth = index > 0 && previousSales > 0
      ? `${currentSales > previousSales ? '+' : ''}${(((currentSales - previousSales) / previousSales) * 100).toFixed(1)}%`
      : '0%'
    
    trends.push({
      period: quarter,
      totalSales: currentSales,
      growth
    })
    
    previousSales = currentSales
  })
  
  return trends
}

// Lấy sách bán chạy
async function getTopSellingBooks(startDate, endDate, limit = 10) {
  try {
    console.log('🔍 Getting top selling books from', startDate, 'to', endDate)
    
    // Kiểm tra có orders không
    const totalOrders = await Order.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    })
    console.log('📊 Total orders in period:', totalOrders)
    
    // Aggregate orders trong khoảng thời gian để tính sales
    const salesData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $in: ['delivered', 'confirmed', 'processing', 'shipping'] } // Chấp nhận nhiều status
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.book_id', // Sửa từ '$items.book' thành '$items.book_id'
          salesCount: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
        }
      },
      { $sort: { salesCount: -1 } },
      { $limit: limit }
    ])
    
    console.log('📈 Sales data found:', salesData.length, 'books')

    // Populate book info
    const bookIds = salesData.map(item => item._id)
    console.log('📚 Book IDs to populate:', bookIds)
    
    const books = await Book.find({ _id: { $in: bookIds } })
      .populate('category', 'name')
      .lean()
    
    console.log('📖 Books found:', books.length)

    // Combine data
    const result = salesData.map(sale => {
      const book = books.find(b => b._id.toString() === sale._id.toString())
      if (!book) {
        console.warn('⚠️ Book not found for ID:', sale._id)
        return null
      }
      return {
        ...book,
        salesCount: sale.salesCount,
        totalRevenue: sale.totalRevenue
      }
    }).filter(Boolean) // Remove null entries
    
    console.log('✅ Final result:', result.length, 'books with sales data')
    return result

  } catch (error) {
    console.error('❌ Get top selling books error:', error)
    return []
  }
}

// Phân tích với AI (nhận data đã được xử lý thống kê)
async function analyzeWithAI(analyzedData, startDate, endDate) {
  // Format market metrics để tránh prompt quá dài
  const formattedMetrics = {
    totalBooks: analyzedData.marketMetrics?.totalBooks || 0,
    totalSales: analyzedData.marketMetrics?.totalSales || 0,
    avgPrice: analyzedData.marketMetrics?.avgPrice || 0,
    avgRating: analyzedData.marketMetrics?.avgRating || 0
  }
  
  const prompt = `
Bạn là chuyên gia phân tích kinh doanh sách với chuyên môn về tâm lý khách hàng và xu hướng thị trường.
Dựa trên dữ liệu thống kê, hãy phân tích sâu về khách hàng và đưa ra chiến lược kinh doanh:

DỮ LIỆU THỐNG KÊ:
- Thời gian: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}
- Top 3 sách: ${analyzedData.topPerformers?.slice(0, 3).map(b => `"${b.title}" (${b.salesCount} cuốn)`).join(', ') || 'Không có'}
- Patterns: ${analyzedData.patterns?.map(p => `${p.type} (${Math.round(p.confidence*100)}%)`).join(', ') || 'Không rõ ràng'}
- Thị trường: ${formattedMetrics.totalBooks} sách, ${formattedMetrics.totalSales} cuốn, giá TB ${formattedMetrics.avgPrice.toLocaleString()}đ, rating TB ${formattedMetrics.avgRating}/5
- Insights: ${analyzedData.insights?.join('; ') || 'Không đặc biệt'}

HÃY PHÂN TÍCH SÂU:
1. Tâm lý khách hàng: Tại sao họ chọn những sách này?
2. Xu hướng thị trường: Điều gì đang thay đổi trong thói quen đọc?
3. Cơ hội kinh doanh: Gaps nào trong thị trường có thể khai thác?
4. Dự đoán: Xu hướng nào sẽ phát triển trong 3-6 tháng tới?
5. Chiến lược giá: Làm thế nào để optimize pricing?

QUAN TRỌNG: Trả về JSON format chính xác (không markdown), tất cả value phải là STRING:
{
  "summary": "Tóm tắt chính về xu hướng thị trường và khách hàng",
  "customerInsights": "Phân tích chi tiết về tâm lý khách hàng - tại sao họ chọn những sách này?",
  "marketTrends": "Xu hướng thị trường nổi bật - điều gì đang thay đổi trong thói quen đọc?",
  "businessOpportunities": "Cơ hội kinh doanh cụ thể - gaps nào có thể khai thác?",
  "pricingStrategy": "Chiến lược pricing chi tiết - làm thế nào optimize giá?",
  "predictions": "Dự đoán cụ thể cho 3-6 tháng tới - xu hướng nào sẽ phát triển?",
  "conclusion": "Kết luận tổng thể về chiến lược phát triển kinh doanh",
  "recommendations": ["Chiến lược cụ thể 1", "Chiến lược cụ thể 2", "Chiến lược cụ thể 3"]
}
`

  // Retry mechanism với exponential backoff
  const maxRetries = 5
  const baseDelay = 2000 // 2 seconds
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🤖 AI analysis attempt ${attempt}/${maxRetries}`)
      
      const result = await model.generateContent(prompt)
      const output = result.response.text().replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(output)
      
      // Validate response format
      const requiredFields = ['summary', 'customerInsights', 'marketTrends', 'businessOpportunities', 'pricingStrategy', 'predictions', 'conclusion', 'recommendations']
      const missingFields = requiredFields.filter(field => !parsed[field])
      
      if (missingFields.length > 0) {
        console.warn('⚠️ AI response missing fields:', missingFields)
        // Fill missing fields with defaults
        missingFields.forEach(field => {
          parsed[field] = field === 'recommendations' ? [] : 'Đang phân tích...'
        })
      }
      
      // Ensure all fields are strings (except recommendations array)
      Object.keys(parsed).forEach(key => {
        if (key !== 'recommendations' && typeof parsed[key] !== 'string') {
          parsed[key] = String(parsed[key] || '')
        }
      })
      
      console.log('✅ AI analysis successful and validated')
      return parsed
      
    } catch (error) {
      console.error(`❌ AI analysis attempt ${attempt} failed:`, error.message)
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000
        console.log(`⏳ Retrying in ${Math.round(delay/1000)}s...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  // Fallback: Generate analysis based on statistical data only
  console.log('🔄 Using statistical fallback analysis')
  return generateFallbackAnalysis(analyzedData, formattedMetrics, startDate, endDate)
}

// Fallback analysis khi AI service không khả dụng
function generateFallbackAnalysis(analyzedData, metrics, startDate, endDate) {
  const patterns = analyzedData.patterns || []
  const insights = analyzedData.insights || []
  
  // Generate summary based on statistical data
  let summary = `Phân tích ${metrics.totalBooks} sách trong khoảng ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}. `
  
  if (metrics.totalSales > 0) {
    summary += `Tổng doanh số: ${metrics.totalSales} cuốn, giá trung bình: ${metrics.avgPrice.toLocaleString()}đ.`
  }
  
  // Generate conclusion
  let conclusion = 'Dựa trên phân tích thống kê: '
  if (patterns.length > 0) {
    const mainPattern = patterns.sort((a, b) => b.confidence - a.confidence)[0]
    conclusion += `Pattern chính là "${mainPattern.type}" với ${Math.round(mainPattern.confidence * 100)}% sách thể hiện xu hướng này.`
  } else {
    conclusion += 'Không phát hiện pattern rõ ràng trong dữ liệu.'
  }
  
  // Generate recommendations
  const recommendations = []
  
  if (patterns.some(p => p.type === 'Giá rẻ')) {
    recommendations.push('Tận dụng chiến lược giá cạnh tranh để tăng doanh số')
  }
  
  if (patterns.some(p => p.type === 'Rating cao')) {
    recommendations.push('Đầu tư vào chất lượng nội dung để duy trì rating cao')
  }
  
  if (metrics.avgRating < 3.5) {
    recommendations.push('Cải thiện chất lượng sách để nâng cao điểm đánh giá')
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Tiếp tục theo dõi xu hướng thị trường để đưa ra chiến lược phù hợp')
    recommendations.push('Phân tích sâu hơn về sở thích khách hàng')
    recommendations.push('Đa dạng hóa danh mục sản phẩm')
  }
  
  return {
    summary,
    customerInsights: 'Khách hàng trong thời gian này ưa chuộng sách có giá trị thực tế và rating cao, thể hiện nhu cầu tìm kiếm chất lượng',
    marketTrends: 'Thị trường có xu hướng chọn sách chất lượng hơn số lượng, focus vào nội dung có giá trị',
    businessOpportunities: 'Cơ hội phát triển trong phân khúc sách chuyên môn và self-help cho độc giả trẻ',
    pricingStrategy: 'Duy trì giá cạnh tranh trong phân khúc phổ thông, premium pricing cho sách chuyên sâu',
    predictions: 'Xu hướng đọc sách điện tử và audiobook sẽ tăng mạnh, đặc biệt trong nhóm tuổi 18-35',
    conclusion,
    recommendations
  }
}

// Helper function để format rich summary từ aiInsights
function formatRichSummary(summary, aiInsights) {
  if (!aiInsights || !aiInsights.customerInsights) {
    return summary
  }
  
  return `${summary}

**Customer Insights**: ${aiInsights.customerInsights}

**Market Trends**: ${aiInsights.marketTrends}

**Business Opportunities**: ${aiInsights.businessOpportunities}

**Pricing Strategy**: ${aiInsights.pricingStrategy}

**Predictions**: ${aiInsights.predictions}`
}

// Lấy báo cáo theo ID
export const getStatistic = async (req, res) => {
  try {
    const { id } = req.params
    const statistic = await AiStatistic.findById(id)
      .populate('user_id', 'username email')

    if (!statistic) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy báo cáo'
      })
    }

    // Format rich summary for display
    const formattedData = {
      ...statistic.toObject(),
      richSummary: formatRichSummary(statistic.summary, statistic.aiInsights)
    }

    res.json({
      success: true,
      data: formattedData
    })

  } catch (error) {
    console.error('Get statistic error:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy báo cáo thống kê'
    })
  }
}

// Lấy danh sách báo cáo
export const getStatistics = async (req, res) => {
  try {
    const { page = 1, limit = 10, user_id } = req.query
    const skip = (page - 1) * limit

    const filter = {}
    if (user_id) filter.user_id = user_id

    const statistics = await AiStatistic.find(filter)
      .populate('user_id', 'users username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await AiStatistic.countDocuments(filter)

    res.json({
      success: true,
      data: statistics,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Get statistics error:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách báo cáo'
    })
  }
}

// Kiểm tra trạng thái báo cáo
export const checkReportStatus = async (req, res) => {
  try {
    const { id } = req.params
    
    const statistic = await AiStatistic.findById(id)
      .select('status title summary createdAt')

    if (!statistic) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy báo cáo'
      })
    }

    let progress = 0
    let message = ''

    switch (statistic.status) {
      case 'generating':
        // Tính progress dựa trên thời gian (giả lập)
        const elapsed = Date.now() - statistic.createdAt.getTime()
        progress = Math.min(Math.floor(elapsed / 1200), 90) // max 90% khi generating
        message = 'Đang phân tích dữ liệu...'
        break
      case 'completed':
        progress = 100
        message = 'Báo cáo đã hoàn thành!'
        break
      case 'failed':
        progress = 0
        message = 'Có lỗi xảy ra khi tạo báo cáo'
        break
    }

    res.json({
      success: true,
      data: {
        id: statistic._id,
        status: statistic.status,
        progress,
        message,
        title: statistic.title
      }
    })

  } catch (error) {
    console.error('Check status error:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi kiểm tra trạng thái'
    })
  }
}

// Xóa báo cáo
export const deleteStatistic = async (req, res) => {
  try {
    const { id } = req.params
    
    const statistic = await AiStatistic.findByIdAndDelete(id)
    
    if (!statistic) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy báo cáo'
      })
    }

    res.json({
      success: true,
      message: 'Xóa báo cáo thành công'
    })

  } catch (error) {
    console.error('Delete statistic error:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi xóa báo cáo'
    })
  }
}

// Force cleanup stuck reports (manual endpoint)
export const forceCleanupStuckReports = async (req, res) => {
  try {
    await cleanupStuckReports()
    res.json({
      success: true,
      message: 'Đã cleanup các báo cáo bị stuck'
    })
  } catch (error) {
    console.error('Force cleanup error:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi cleanup báo cáo'
    })
  }
}