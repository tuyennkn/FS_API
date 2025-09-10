import Joi from 'joi'
import { sendValidationError } from '../utils/responseHelper.js'
const createBook = async (req, res, next) => {
    const schema = Joi.object({
        title: Joi.string().min(2).max(200).required(),
        author: Joi.string().allow('', null),
        summary: Joi.string().allow('', null),
        publisher: Joi.string().allow('', null),
        price: Joi.number().required(),
        rating: Joi.number().min(0).max(5).default(0),
        category_id: Joi.string().hex().length(24).allow(null),
        quantity: Joi.number().default(0),
        sold: Joi.number().default(0),
        imageUrl: Joi.string().uri().allow('', null),
        isDisable: Joi.boolean().default(false)
    })
    try{
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

const updateBook = async (req, res, next) => {
    const schema = Joi.object({
    id: Joi.string().hex().length(24).required(),
    title: Joi.string().min(2).max(200),
    author: Joi.string().allow('', null),

    summary: Joi.string().allow('', null),
    publisher: Joi.string().allow('', null),
    price: Joi.number(),
    rating: Joi.number().min(0).max(5),
    category_id: Joi.string().hex().length(24).allow(null),
    quantity: Joi.number(),
    sold: Joi.number(),
    imageUrl: Joi.string().uri().allow('', null),
    isDisable: Joi.boolean()
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

export const bookValidation = {
    createBook,
    updateBook
}