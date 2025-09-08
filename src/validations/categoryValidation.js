import Joi from 'joi'

// Middleware validation cho tạo Category
const createCategory = async (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.base': 'Tên category phải là chuỗi',
        'string.empty': 'Tên category không được để trống',
        'string.min': 'Tên category ít nhất 2 ký tự',
        'string.max': 'Tên category tối đa 100 ký tự',
        'any.required': 'Tên category là bắt buộc'
      }),

    description: Joi.string()
      .allow('', null)
      .messages({
        'string.base': 'Description phải là chuỗi'
      })
  })

  try {
    await schema.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (err) {
    const errors = err.details.map(e => e.message)
    return res.status(400).json({
      message: 'Validation error',
      errors
    })
  }
}

// Middleware validation cho update Category
const updateCategory = async (req, res, next) => {
  const schema = Joi.object({
    id: Joi.string(),
    name: Joi.string()
      .min(2)
      .max(100)
      .messages({
        'string.base': 'Tên category phải là chuỗi',
        'string.min': 'Tên category ít nhất 2 ký tự',
        'string.max': 'Tên category tối đa 100 ký tự'
      }),

    description: Joi.string()
      .allow('', null)
      .messages({
        'string.base': 'Description phải là chuỗi'
      }),

    isDisable: Joi.boolean().messages({
      'boolean.base': 'isDisable phải là kiểu boolean'
    })
  })

  try {
    await schema.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (err) {
    const errors = err.details.map(e => e.message)
    return res.status(400).json({
      message: 'Validation error',
      errors
    })
  }
}

export const categoryValidation = {
  createCategory,
  updateCategory
}
