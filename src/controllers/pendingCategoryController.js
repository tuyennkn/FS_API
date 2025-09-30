import PendingCategory from '../models/PendingCategory.js'
import Category from '../models/Category.js'
import Book from '../models/Book.js'
import { analyzeCategoryFromGenre } from '../services/AI/gemini.service.js'
import { sendError, sendSuccess } from '../utils/responseHelper.js'
import { PendingCategoryDTO } from '../dto/PendingCategoryDTO.js'

// Tạo pending category mới từ AI analysis
export const createPendingCategory = async (req, res) => {
  try {
    const { book_id, genre } = req.body

    // Kiểm tra book có tồn tại không
    const book = await Book.findById(book_id)
    if (!book) {
      return sendError(res, 'Book not found', 404)
    }

    // Kiểm tra đã tồn tại pending category cho book này chưa
    const existingPending = await PendingCategory.findOne({ 
      book_id, 
      status: 'pending' 
    })
    if (existingPending) {
      return sendError(res, 'Pending category already exists for this book', 400)
    }

    // Sử dụng AI để phân tích genre và đề xuất category
    let aiAnalysis
    try {
      const analysisResult = await analyzeCategoryFromGenre(genre)
      aiAnalysis = JSON.parse(analysisResult)
    } catch (error) {
      console.error('AI Analysis error:', error)
      // Fallback if AI fails
      aiAnalysis = {
        name: genre,
        description: `Category for ${genre} books`
      }
    }

    // Tạo pending category
    const pendingCategory = new PendingCategory({
      ai_recommended_name: aiAnalysis.name,
      ai_recommended_description: aiAnalysis.description,
      book_id,
      book_data: {
        title: book.title,
        author: book.author,
        genre: book.genre,
        image: book.image
      }
    })

    await pendingCategory.save()
    
    const responseData = PendingCategoryDTO.toResponse(pendingCategory)
    return sendSuccess(res, responseData, 'Pending category created successfully', 201)
  } catch (error) {
    console.error('Create pending category error:', error)
    return sendError(res, error.message, 500)
  }
}

// Lấy danh sách pending categories
export const getPendingCategories = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status = 'pending',
      search 
    } = req.query

    const query = { status }
    
    // Search functionality
    if (search) {
      query.$or = [
        { ai_recommended_name: { $regex: search, $options: 'i' } },
        { 'book_data.title': { $regex: search, $options: 'i' } },
        { 'book_data.author': { $regex: search, $options: 'i' } }
      ]
    }

    // Manual pagination
    const pageNumber = parseInt(page)
    const limitNumber = parseInt(limit)
    const skip = (pageNumber - 1) * limitNumber

    // Get total count for pagination
    const totalDocs = await PendingCategory.countDocuments(query)
    const totalPages = Math.ceil(totalDocs / limitNumber)

    // Get paginated results
    const categories = await PendingCategory.find(query)
      .populate('book_id', 'title author genre')
      .populate('reviewed_by', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber)

    const listData = {
      results: categories,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total: totalDocs,
        pages: totalPages
      },
      total: totalDocs
    }

    const responseData = PendingCategoryDTO.toAdminListResponse(listData)
    return sendSuccess(res, responseData, 'Pending categories retrieved successfully')
  } catch (error) {
    console.error('Get pending categories error:', error)
    return sendError(res, error.message, 500)
  }
}

// Lấy pending category theo ID
export const getPendingCategoryById = async (req, res) => {
  try {
    const { id } = req.params
    
    const pendingCategory = await PendingCategory.findById(id)
      .populate('book_id', 'title author genre image')
      .populate('reviewed_by', 'username email')

    if (!pendingCategory) {
      return sendError(res, 'Pending category not found', 404)
    }

    const responseData = PendingCategoryDTO.toAdminResponse(pendingCategory)
    return sendSuccess(res, responseData, 'Pending category retrieved successfully')
  } catch (error) {
    console.error('Get pending category error:', error)
    return sendError(res, error.message, 500)
  }
}

// Duyệt pending category - tạo category mới
export const approvePendingCategory = async (req, res) => {
  try {
    const { id } = req.params
    const { 
      category_name, 
      category_description, 
      review_notes 
    } = req.body
    const reviewed_by = req.user.id

    const pendingCategory = await PendingCategory.findById(id)
    if (!pendingCategory) {
      return sendError(res, 'Pending category not found', 404)
    }

    if (pendingCategory.status !== 'pending') {
      return sendError(res, 'This pending category has already been reviewed', 400)
    }

    // Kiểm tra category đã tồn tại chưa
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${category_name}$`, 'i') }
    })

    let categoryId
    if (existingCategory) {
      categoryId = existingCategory._id
    } else {
      // Tạo category mới
      const newCategory = new Category({
        name: category_name,
        description: category_description
      })
      await newCategory.save()
      categoryId = newCategory._id
    }

    // Cập nhật book với category mới
    await Book.findByIdAndUpdate(pendingCategory.book_id, {
      category: categoryId
    })

    // Cập nhật pending category status
    pendingCategory.status = 'approved'
    pendingCategory.reviewed_by = reviewed_by
    pendingCategory.review_notes = review_notes
    await pendingCategory.save()

    const responseData = {
      pending_category: PendingCategoryDTO.toAdminResponse(pendingCategory),
      category_id: categoryId,
      message: existingCategory ? 'Book assigned to existing category' : 'New category created and assigned'
    }

    return sendSuccess(res, responseData, 'Pending category approved successfully')
  } catch (error) {
    console.error('Approve pending category error:', error)
    return sendError(res, error.message, 500)
  }
}

// Từ chối pending category
export const rejectPendingCategory = async (req, res) => {
  try {
    const { id } = req.params
    const { review_notes } = req.body
    const reviewed_by = req.user.id

    const pendingCategory = await PendingCategory.findById(id)
    if (!pendingCategory) {
      return sendError(res, 'Pending category not found', 404)
    }

    if (pendingCategory.status !== 'pending') {
      return sendError(res, 'This pending category has already been reviewed', 400)
    }

    // Cập nhật status
    pendingCategory.status = 'rejected'
    pendingCategory.reviewed_by = reviewed_by
    pendingCategory.review_notes = review_notes
    await pendingCategory.save()

    const responseData = PendingCategoryDTO.toAdminResponse(pendingCategory)
    return sendSuccess(res, responseData, 'Pending category rejected successfully')
  } catch (error) {
    console.error('Reject pending category error:', error)
    return sendError(res, error.message, 500)
  }
}

// Assign book to existing category
export const assignToExistingCategory = async (req, res) => {
  try {
    const { id } = req.params
    const { category_id, review_notes } = req.body
    const reviewed_by = req.user.id

    const pendingCategory = await PendingCategory.findById(id)
    if (!pendingCategory) {
      return sendError(res, 'Pending category not found', 404)
    }

    if (pendingCategory.status !== 'pending') {
      return sendError(res, 'This pending category has already been reviewed', 400)
    }

    // Kiểm tra category có tồn tại không
    const category = await Category.findById(category_id)
    if (!category) {
      return sendError(res, 'Category not found', 404)
    }

    // Cập nhật book với category
    await Book.findByIdAndUpdate(pendingCategory.book_id, {
      category: category_id
    })

    // Cập nhật pending category status
    pendingCategory.status = 'approved'
    pendingCategory.reviewed_by = reviewed_by
    pendingCategory.review_notes = review_notes
    await pendingCategory.save()

    const responseData = {
      pending_category: PendingCategoryDTO.toAdminResponse(pendingCategory),
      category: category
    }

    return sendSuccess(res, responseData, 'Book assigned to existing category successfully')
  } catch (error) {
    console.error('Assign to existing category error:', error)
    return sendError(res, error.message, 500)
  }
}

// Xóa pending category
export const deletePendingCategory = async (req, res) => {
  try {
    const { id } = req.params

    const pendingCategory = await PendingCategory.findByIdAndDelete(id)
    if (!pendingCategory) {
      return sendError(res, 'Pending category not found', 404)
    }

    return sendSuccess(res, null, 'Pending category deleted successfully')
  } catch (error) {
    console.error('Delete pending category error:', error)
    return sendError(res, error.message, 500)
  }
}

// Lấy thống kê pending categories
export const getPendingCategoryStats = async (req, res) => {
  try {
    const stats = await PendingCategory.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ])

    const result = {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: 0
    }

    stats.forEach(stat => {
      result[stat._id] = stat.count
      result.total += stat.count
    })

    const responseData = PendingCategoryDTO.toStatsResponse(result)
    return sendSuccess(res, responseData, 'Pending category stats retrieved successfully')
  } catch (error) {
    console.error('Get pending category stats error:', error)
    return sendError(res, error.message, 500)
  }
}
