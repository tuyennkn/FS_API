import Joi from 'joi'

const orderValidation = {
  createOrder: {
    body: Joi.object({
      payment_type: Joi.string().valid('cash', 'card', 'online').default('cash').messages({
        'any.only': 'Payment type must be one of: cash, card, online'
      })
    })
  },

  createDirectOrder: {
    body: Joi.object({
      items: Joi.array().items(
        Joi.object({
          product_id: Joi.string().required().messages({
            'string.empty': 'Product ID is required',
            'any.required': 'Product ID is required'
          }),
          quantity: Joi.number().integer().min(1).required().messages({
            'number.base': 'Quantity must be a number',
            'number.integer': 'Quantity must be an integer',
            'number.min': 'Quantity must be at least 1',
            'any.required': 'Quantity is required'
          }),
          price: Joi.number().min(0).required().messages({
            'number.base': 'Price must be a number',
            'number.min': 'Price must be at least 0',
            'any.required': 'Price is required'
          })
        })
      ).min(1).required().messages({
        'array.min': 'At least one item is required',
        'any.required': 'Items are required'
      }),
      total_price: Joi.number().min(0).required().messages({
        'number.base': 'Total price must be a number',
        'number.min': 'Total price must be at least 0',
        'any.required': 'Total price is required'
      }),
      payment_type: Joi.string().valid('cash', 'card', 'online').default('cash').messages({
        'any.only': 'Payment type must be one of: cash, card, online'
      })
    })
  },

  getOrders: {
    query: Joi.object({
      page: Joi.number().integer().min(1).default(1).messages({
        'number.base': 'Page must be a number',
        'number.integer': 'Page must be an integer',
        'number.min': 'Page must be at least 1'
      }),
      limit: Joi.number().integer().min(1).max(100).default(10).messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit must be at most 100'
      })
    })
  },

  getOrderById: {
    params: Joi.object({
      id: Joi.string().required().messages({
        'string.empty': 'Order ID is required',
        'any.required': 'Order ID is required'
      })
    })
  }
}

export default orderValidation