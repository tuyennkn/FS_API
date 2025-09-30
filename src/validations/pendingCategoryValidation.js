import Joi from 'joi'
import { sendValidationError } from '../utils/responseHelper.js'

// Validation cho tạo pending category
export const createPendingCategoryValidation = async (req, res, next) => {
  const schema = Joi.object({
    book_id: Joi.string().hex().length(24).required(),
    genre: Joi.string().min(1).max(100).required()
  })

  try {
    await schema.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (err) {
    const errors = err.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value
    }))
    return sendValidationError(res, errors)
  }
}

// Validation cho approve pending category
export const approvePendingCategoryValidation = async (req, res, next) => {
  const schema = Joi.object({
    category_name: Joi.string().min(2).max(100).required(),
    category_description: Joi.string().max(500).allow('', null),
    review_notes: Joi.string().max(1000).allow('', null)
  })

  try {
    await schema.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (err) {
    const errors = err.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value
    }))
    return sendValidationError(res, errors)
  }
}

// Validation cho reject pending category
export const rejectPendingCategoryValidation = async (req, res, next) => {
  const schema = Joi.object({
    review_notes: Joi.string().max(1000).required()
  })

  try {
    await schema.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (err) {
    const errors = err.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value
    }))
    return sendValidationError(res, errors)
  }
}

// Validation cho assign to existing category
export const assignCategoryValidation = async (req, res, next) => {
  const schema = Joi.object({
    category_id: Joi.string().hex().length(24).required(),
    review_notes: Joi.string().max(1000).allow('', null)
  })

  try {
    await schema.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (err) {
    const errors = err.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value
    }))
    return sendValidationError(res, errors)
  }
}

// Validation cho query parameters
export const getPendingCategoriesValidation = async (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    status: Joi.string().valid('pending', 'approved', 'rejected').default('pending'),
    search: Joi.string().max(100).allow('', null)
  })

  try {
    const { error, value } = schema.validate(req.query)
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }))
      return sendValidationError(res, errors)
    }
    req.query = value
    next()
  } catch (err) {
    return sendValidationError(res, [{ message: err.message }])
  }
}
