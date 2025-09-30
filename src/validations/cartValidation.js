import Joi from 'joi'

const cartValidation = {
  addToCart: {
    body: Joi.object({
      product_id: Joi.string().required().messages({
        'string.empty': 'Product ID is required',
        'any.required': 'Product ID is required'
      }),
      quantity: Joi.number().integer().min(1).default(1).messages({
        'number.base': 'Quantity must be a number',
        'number.integer': 'Quantity must be an integer',
        'number.min': 'Quantity must be at least 1'
      })
    })
  },

  updateCartItem: {
    body: Joi.object({
      product_id: Joi.string().required().messages({
        'string.empty': 'Product ID is required',
        'any.required': 'Product ID is required'
      }),
      quantity: Joi.number().integer().min(0).required().messages({
        'number.base': 'Quantity must be a number',
        'number.integer': 'Quantity must be an integer',
        'number.min': 'Quantity must be at least 0',
        'any.required': 'Quantity is required'
      })
    })
  },

  removeFromCart: {
    params: Joi.object({
      product_id: Joi.string().required().messages({
        'string.empty': 'Product ID is required',
        'any.required': 'Product ID is required'
      })
    })
  }
}

export default cartValidation