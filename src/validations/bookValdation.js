import Joi from 'joi'
import { sendValidationError } from '../utils/responseHelper.js'
const createBook = async (req, res, next) => {
    const schema = Joi.object({
        title: Joi.string().min(2).max(200).required(),
        author: Joi.string().allow('', null),
        description: Joi.string().allow('', null), // Changed from summary
        slug: Joi.string().min(2).max(200).allow('', null), // Make slug optional, controller will auto-generate
        publisher: Joi.string().allow('', null), // Keep for backward compatibility, will be moved to attributes
        price: Joi.number().required(),
        rating: Joi.number().min(0).max(5).default(0),
        category: Joi.string().hex().length(24).allow(null),
        genre: Joi.string().allow('', null), // New field
        quantity: Joi.number().default(0),
        sold: Joi.number().default(0),
        image: Joi.array().items(Joi.string().uri()).allow(null), // Changed from imageUrl to array
        isDisable: Joi.boolean().default(false),
        
        // New attributes object
        attributes: Joi.object({
            isbn: Joi.string().allow('', null),
            publisher: Joi.string().allow('', null),
            firstPublishDate: Joi.date().allow(null),
            publishDate: Joi.date().allow(null),
            pages: Joi.number().min(1).allow(null),
            language: Joi.string().allow('', null),
            edition: Joi.string().allow('', null),
            bookFormat: Joi.string().allow('', null),
            characters: Joi.array().items(Joi.string()).allow(null),
            awards: Joi.array().items(Joi.string()).allow(null)
        }).allow(null)
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
    description: Joi.string().allow('', null), // Changed from summary
    slug: Joi.string().min(2).max(200).allow('', null), // Make optional for consistency
    publisher: Joi.string().allow('', null), // Keep for backward compatibility
    price: Joi.number(),
    rating: Joi.number().min(0).max(5),
    category: Joi.string().hex().length(24).allow(null),
    genre: Joi.string().allow('', null), // New field
    quantity: Joi.number(),
    sold: Joi.number(),
    image: Joi.array().items(Joi.string().uri()).allow(null), // Changed from imageUrl
    isDisable: Joi.boolean(),
    
    // New attributes object
    attributes: Joi.object({
        isbn: Joi.string().allow('', null),
        publisher: Joi.string().allow('', null),
        firstPublishDate: Joi.date().allow(null),
        publishDate: Joi.date().allow(null),
        pages: Joi.number().min(1).allow(null),
        language: Joi.string().allow('', null),
        edition: Joi.string().allow('', null),
        bookFormat: Joi.string().allow('', null),
        characters: Joi.array().items(Joi.string()).allow(null),
        awards: Joi.array().items(Joi.string()).allow(null)
    }).allow(null)
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