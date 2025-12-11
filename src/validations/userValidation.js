import Joi from "joi";

export const validateUpdateUser = (req, res, next) => {
    const schema = Joi.object({
        username: Joi.string().alphanum().min(3).max(30).messages({
            'string.base': 'Username phải là chuỗi',
            'string.empty': 'Username không được để trống',
            'string.min': 'Username ít nhất 3 ký tự',
            'string.max': 'Username tối đa 30 ký tự',
        }),
        fullname: Joi.string().min(3).max(50).messages({
            'string.base': 'Họ tên phải là chuỗi',
            'string.empty': 'Họ tên không được để trống',
            'string.min': 'Họ tên ít nhất 3 ký tự',
            'string.max': 'Họ tên tối đa 50 ký tự',
        }),
        // except password
        email: Joi.string().email().messages({
            'string.base': 'Email phải là chuỗi',
            'string.empty': 'Email không được để trống',
            'string.email': 'Email không hợp lệ',
        }),
        phone: Joi.string().pattern(/^[0-9]{9,12}$/).messages({
            'string.base': 'Số điện thoại phải là chuỗi',
            'string.empty': 'Số điện thoại không được để trống',
            'string.pattern.base': 'Số điện thoại không hợp lệ',
        }),
        address: Joi.string().min(5).max(100).optional().messages({
            'string.base': 'Địa chỉ phải là chuỗi',
            'string.empty': 'Địa chỉ không được để trống',
            'string.min': 'Địa chỉ ít nhất 5 ký tự',
            'string.max': 'Địa chỉ tối đa 100 ký tự',
        }),
        birthday: Joi.date().less('now').optional().messages({
            'date.base': 'Ngày sinh không hợp lệ',
            'date.less': 'Ngày sinh phải trước ngày hiện tại',
        }),
        avatar: Joi.string().uri().optional().messages({
            'string.base': 'Avatar phải là chuỗi',
            'string.uri': 'Avatar phải là một URL hợp lệ',
        }),
        gender: Joi.string().valid('male', 'female', 'other').optional().messages({
            'string.base': 'Giới tính phải là chuỗi',
            'any.only': 'Giới tính phải là "male", "female" hoặc "other"', 
        }),
        persona: Joi.string().allow('').optional().messages({
            'string.base': 'Persona phải là chuỗi',
        }),
    });

    try {
        const { error } = schema.validate(req.body, { abortEarly: false });
        if (error) {
            const errorMessages = error.details.map(detail => detail.message);
            return res.status(400).json({
                status: 'error',
                message: 'Dữ liệu không hợp lệ',
                errors: errorMessages
            });
        }
        next();
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: 'error',
            message: 'Đã xảy ra lỗi',
        });
    }
}

export const validateUpdatePersona = (req, res, next) => {
    const schema = Joi.object({
        persona: Joi.string().required().messages({
            'string.base': 'Persona phải là chuỗi',
            'string.empty': 'Persona không được để trống',
            'any.required': 'Persona là bắt buộc'
        }),
    });

    try {
        const { error } = schema.validate(req.body, { abortEarly: false });
        if (error) {
            const errorMessages = error.details.map(detail => detail.message);
            return res.status(400).json({
                status: 'error',
                message: 'Dữ liệu không hợp lệ',
                errors: errorMessages
            });
        }
        next();
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: 'error',
            message: 'Đã xảy ra lỗi',
        });
    }
}