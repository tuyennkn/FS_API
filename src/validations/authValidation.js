import Joi from 'joi'
import { sendValidationError } from '../utils/responseHelper.js'

// Middleware validation cho đăng ký
const createUser = async (req, res, next) => {
  const schema = Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(30)
      .required()
      .messages({
        'string.base': 'Username phải là chuỗi',
        'string.empty': 'Username không được để trống',
        'string.min': 'Username ít nhất 3 ký tự',
        'string.max': 'Username tối đa 30 ký tự',
        'any.required': 'Username là bắt buộc'
      }),

    fullname: Joi.string()
      .min(3)
      .max(50)
      .required()
      .messages({
        'string.base': 'Fullname phải là chuỗi',
        'string.empty': 'Fullname không được để trống',
        'string.min': 'Fullname ít nhất 3 ký tự',
        'string.max': 'Fullname tối đa 50 ký tự',
        'any.required': 'Fullname là bắt buộc'
      }),

    password: Joi.string()
      .min(6)
      .max(50)
      .required()
      .messages({
        'string.empty': 'Password không được để trống',
        'string.min': 'Password ít nhất 6 ký tự',
        'string.max': 'Password tối đa 50 ký tự',
        'any.required': 'Password là bắt buộc'
      }),

    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Email không hợp lệ',
        'string.empty': 'Email không được để trống',
        'any.required': 'Email là bắt buộc'
      }),

    phone: Joi.string()
      .pattern(/^[0-9]{9,12}$/)
      .required()
      .messages({
        'string.pattern.base': 'Số điện thoại không hợp lệ',
        'string.empty': 'Số điện thoại không được để trống',
        'any.required': 'Số điện thoại là bắt buộc'
      }),

    gender: Joi.string()
      .valid('male', 'female', 'other')
      .optional()
      .messages({
        'any.only': 'Gender chỉ được chọn male, female hoặc other'
      }),

    birthday: Joi.date()
      .optional()
      .messages({
        'date.base': 'Birthday phải là ngày hợp lệ'
      })
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
export const validateLogin = async (req, res, next) => {
  const schema = Joi.object({
    username: Joi.string()
      .required()
      .messages({
        'string.base': 'Username phải là chuỗi',
        'string.empty': 'Username không được để trống',
        'any.required': 'Username là bắt buộc'
      }),

    password: Joi.string()
      .min(6)
      .required()
      .messages({
        'string.empty': 'Password không được để trống',
        'string.min': 'Password ít nhất 6 ký tự',
        'any.required': 'Password là bắt buộc'
      })
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
export const authValidation = {
  createUser,
  validateLogin
}
