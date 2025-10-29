import Joi from 'joi'
import { sendValidationError } from '../utils/responseHelper.js'

const createComment = async (req, res, next) => {
    const Schema = Joi.object({
        book_id: Joi.string().required().messages({
            'string.empty': 'Book ID không được để trống'
        }),
        rating: Joi.number().min(1).max(5).required().messages({
            'number.min': 'Rating phải >= 1',
            'number.max': 'Rating phải <= 5'
        }),
        comment: Joi.string().min(1).max(500).required().messages({
            'string.empty': 'Nội dung bình luận không được để trống',
            'string.min': 'Bình luận phải có ít nhất 1 ký tự',
            'string.max': 'Bình luận không được vượt quá 500 ký tự'
        })
    })
    try {
        await Schema.validateAsync(req.body, { abortEarly: false })
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

const updateComment = async (req, res, next) => {
    const Schema = Joi.object({
        rating: Joi.number().min(1).max(5).messages({
            'number.min': 'Rating phải >= 1',
            'number.max': 'Rating phải <= 5'
        }),
        comment: Joi.string().min(1).max(500).messages({
            'string.min': 'Bình luận phải có ít nhất 1 ký tự',
            'string.max': 'Bình luận không được vượt quá 500 ký tự'
        }),
        isDisabled: Joi.boolean() // Cho phép admin toggle disable
    })

    try {
        await Schema.validateAsync(req.body, { abortEarly: false })
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

export const commentValidation = {
    createComment,
    updateComment
}