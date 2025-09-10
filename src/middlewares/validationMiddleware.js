/**
 * Request Validation Middleware
 * Middleware để validate request data
 */

import { sendValidationError } from '../utils/responseHelper.js'

/**
 * Middleware validate request body
 * @param {object} schema - Joi validation schema
 * @returns {function} Express middleware function
 */
export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { 
      abortEarly: false,
      stripUnknown: true 
    })

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }))
      return sendValidationError(res, errors)
    }

    req.body = value
    next()
  }
}

/**
 * Middleware validate query parameters
 * @param {object} schema - Joi validation schema
 * @returns {function} Express middleware function
 */
export const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, { 
      abortEarly: false,
      stripUnknown: true 
    })

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
  }
}

/**
 * Middleware validate route parameters
 * @param {object} schema - Joi validation schema
 * @returns {function} Express middleware function
 */
export const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, { 
      abortEarly: false,
      stripUnknown: true 
    })

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }))
      return sendValidationError(res, errors)
    }

    req.params = value
    next()
  }
}
