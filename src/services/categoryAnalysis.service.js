import PendingCategory from '../models/PendingCategory.js'
import Category from '../models/Category.js'
import Book from '../models/Book.js'
import { analyzeCategoryFromGenre } from './AI/gemini.service.js'

/**
 * Kiểm tra và xử lý category cho book khi import
 * @param {Object} bookData - Dữ liệu book cần kiểm tra
 * @param {string} bookData.genre - Genre của sách
 * @param {string} bookData._id - ID của book vừa tạo
 * @param {string} bookData.title - Tên sách
 * @param {string} bookData.author - Tác giả
 * @param {Array} bookData.image - Ảnh sách
 * @returns {Object|null} - Category được assign hoặc null nếu tạo pending
 */
export const handleCategoryForBook = async (bookData, allCategories) => {
    try {
        const { genre, _id: book_id, title, author, image } = bookData

        if (!genre) {
            console.log('No genre provided for book:', title)
            return null
        }

        // Bước 1: gọi AI để phân tích genre và suy ra category
        let aiAnalysis
        try {
            const analysisResult = await analyzeCategoryFromGenre(genre, title, author, allCategories)
            // Xử lý kết quả trả về
            if (typeof analysisResult === 'string') {
                const cleanedResult = analysisResult.replace(/```json|```/g, '').trim()
                aiAnalysis = JSON.parse(cleanedResult)
            } else if (typeof analysisResult === 'object' && analysisResult !== null) {
                aiAnalysis = analysisResult
            } else {
                throw new Error('Invalid AI response format')
            }
        } catch (aiError) {
            console.error('AI Analysis failed, using fallback:', aiError)
            aiAnalysis = {
                isNew: true,
                name: genre,
                description: `Category for ${genre} books`
            }
        }

        // Nếu AI chọn category có sẵn
        if (!aiAnalysis.isNew) {
            const existingCategory = allCategories.find(c => 
                c.name.toLowerCase() === aiAnalysis.name.toLowerCase()
            )
            
            if (existingCategory) {
                console.log(`AI matched existing category: ${existingCategory.name} for genre: ${genre}`)
                return existingCategory
            }
        }

        // Bước 2: AI đề xuất mới hoặc không tìm thấy -> tạo pending category
        await createPendingCategoryFromGenre({
            book_id,
            genre,
            title,
            author,
            image,
            name: aiAnalysis.name,
            description: aiAnalysis.description
        })

        console.log(`Created pending category for book: ${title} with genre: ${genre}`)
        return null

    } catch (error) {
        console.error('Error handling category for book:', error)
        return null
    }
}

/**
 * Tạo pending category từ genre
 * @param {Object} params - Thông tin để tạo pending category
 */
export const createPendingCategoryFromGenre = async ({
    book_id,
    genre,
    title,
    author,
    image,
    name,
    description
}) => {
    try {
        // Kiểm tra đã tồn tại pending category cho book này chưa
        const existingPending = await PendingCategory.findOne({
            book_id,
            status: 'pending'
        })

        if (existingPending) {
            console.log('Pending category already exists for book:', title)
            return existingPending
        }

        // Tạo pending category
        const pendingCategory = new PendingCategory({
            ai_recommended_name: name,
            ai_recommended_description: description,
            book_id,
            book_data: {
                title,
                author,
                genre,
                image: image || []
            }
        })

        await pendingCategory.save()
        return pendingCategory

    } catch (error) {
        console.error('Error creating pending category:', error)
        throw error
    }
}

/**
 * Lấy thống kê pending categories
 */
export const getPendingCategoryStatistics = async () => {
    try {
        const stats = await PendingCategory.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ])

        const recentPending = await PendingCategory.countDocuments({
            status: 'pending',
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
        })

        return {
            total: stats.reduce((sum, stat) => sum + stat.count, 0),
            pending: stats.find(s => s._id === 'pending')?.count || 0,
            approved: stats.find(s => s._id === 'approved')?.count || 0,
            rejected: stats.find(s => s._id === 'rejected')?.count || 0,
            recentPending
        }
    } catch (error) {
        console.error('Error getting pending category statistics:', error)
        return {
            total: 0,
            pending: 0,
            approved: 0,
            rejected: 0,
            recentPending: 0
        }
    }
}

/**
 * Bulk approve pending categories với cùng AI recommendation
 * @param {string} aiRecommendedName - Tên category được AI đề xuất
 * @param {string} finalCategoryName - Tên category cuối cùng sẽ tạo
 * @param {string} finalCategoryDescription - Mô tả category cuối cùng
 * @param {string} reviewedBy - ID của admin duyệt
 */
export const bulkApprovePendingCategories = async (
    aiRecommendedName,
    finalCategoryName,
    finalCategoryDescription,
    reviewedBy
) => {
    try {
        // Tìm tất cả pending categories có cùng AI recommendation
        const pendingCategories = await PendingCategory.find({
            ai_recommended_name: aiRecommendedName,
            status: 'pending'
        })

        if (pendingCategories.length === 0) {
            return { success: false, message: 'No pending categories found' }
        }

        // Tìm hoặc tạo category
        let category = await Category.findOne({
            name: { $regex: new RegExp(`^${finalCategoryName}$`, 'i') }
        })

        if (!category) {
            category = new Category({
                name: finalCategoryName,
                description: finalCategoryDescription
            })
            await category.save()
        }

        // Update all books với category mới
        const bookIds = pendingCategories.map(pc => pc.book_id)
        await Book.updateMany(
            { _id: { $in: bookIds } },
            { category: category._id }
        )

        // Update all pending categories
        await PendingCategory.updateMany(
            { ai_recommended_name: aiRecommendedName, status: 'pending' },
            {
                status: 'approved',
                reviewed_by: reviewedBy,
                review_notes: 'Bulk approved'
            }
        )

        return {
            success: true,
            count: pendingCategories.length,
            category: category
        }

    } catch (error) {
        console.error('Error bulk approving pending categories:', error)
        throw error
    }
}