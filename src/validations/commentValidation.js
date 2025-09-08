import Joi from 'joi'

const createComment = async (req, res, next) => {
    const Schema = Joi.object({
        book_id: Joi.string().required().messages({
            'string.empty': 'Book ID không được để trống'
        }),
        rating: Joi.number().min(1).max(5).required().messages({
            'number.min': 'Rating phải >= 1',
            'number.max': 'Rating phải <= 5'
        }),
        content: Joi.string().min(0).max(500)
    })
    try {
        await Schema.validateAsync(req.body, { abortEarly: false })
        next()
    } catch (err) {
        const errors = err.details.map(e => e.message)
        return res.status(400).json({
            message: 'Validation error them comment that bai',
            errors
        })
    }
}

const updateComment = async (req, res, next) => {
    const Schema = Joi.object({
        rating: Joi.number().min(1).max(5).messages({
            'number.min': 'Rating phải >= 1',
            'number.max': 'Rating phải <= 5'
        }),
        content: Joi.string().min(0).max(500)
    })

    try {
        await Schema.validateAsync(req.body, { abortEarly: false })
        next()
    } catch (err) {
        const errors = err.details.map(e => e.message)
        return res.status(400).json({
            message: 'Validation error cap nhat comment that bai',
            errors
        })
    }

}

export const commentValidation = {
    createComment,
    updateComment
}