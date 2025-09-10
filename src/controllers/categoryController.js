import Category from '~/models/Category'
import { 
  sendSuccess, 
  sendError, 
  sendCreated,
  sendNotFound,
  sendConflict 
} from '../utils/responseHelper.js'
import { CategoryDTO } from '../dto/index.js'
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../utils/constants.js'

const createCategory = async (req, res, next) => {
    try {
        const { name, description } = req.body
        const exists = await Category.findOne({ name })
        if (exists) {
            return sendConflict(res, 'Tên danh mục đã tồn tại')
        }
        const category = new Category({ name, description })
        await category.save()

        const responseData = CategoryDTO.toResponse(category)
        return sendCreated(res, responseData, SUCCESS_MESSAGES.CATEGORY_CREATED)
    } catch (err) {
        next(err)
    }
}

const updateCategory = async (req, res, next) => {
    try {
        const { id } = req.body
        const { name, description, isDisable } = req.body
        
        const category = await Category.findByIdAndUpdate(
            id,
            { name, description, isDisable },
            { new: true, runValidators: true }
        )
        if (!category) {
            return sendNotFound(res, ERROR_MESSAGES.CATEGORY_NOT_FOUND)
        }
        const responseData = CategoryDTO.toResponse(category)
        return sendSuccess(res, responseData, SUCCESS_MESSAGES.CATEGORY_UPDATED)
    } catch (err) {
        next(err)
    }
}

const listCategories = async (req, res, next) => {
    try {
        const categories = await Category.find()
        const responseData = CategoryDTO.toResponseList(categories)
        return sendSuccess(res, responseData, SUCCESS_MESSAGES.CATEGORY_RETRIEVED)
    } catch (err) {
        next(err)
    }
}

const getCategory = async (req, res, next) => {
    try {
        const { id } = req.body
        const category = await Category.findById(id)        
        if (!category) {
            return sendNotFound(res, ERROR_MESSAGES.CATEGORY_NOT_FOUND)
        }
        const responseData = CategoryDTO.toResponse(category)
        return sendSuccess(res, responseData, SUCCESS_MESSAGES.CATEGORY_RETRIEVED)
    } catch (err) {
        next(err)
    }
}

const toggleDisbaleCategory = async (req, res) => {
     try {
        const { id, isDisable } = req.body
        const category = await Category.findByIdAndUpdate(id, { isDisable }, { new: true })
        if (!category) {
            return sendNotFound(res, ERROR_MESSAGES.CATEGORY_NOT_FOUND)
        }
        const responseData = CategoryDTO.toResponse(category)
        return sendSuccess(res, responseData, SUCCESS_MESSAGES.CATEGORY_UPDATED)
    } catch (error) {
        return sendError(res, ERROR_MESSAGES.INTERNAL_ERROR, 500, { message: error.message })
    }
}

export const categoryController = {
    createCategory,
    updateCategory,
    listCategories,
    getCategory,
    toggleDisbaleCategory
}