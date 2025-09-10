import Joi from 'joi';

// Validation for CSV import
export const csvImportValidation = (req, res, next) => {
  // Check if file is uploaded
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'CSV file is required',
      statusCode: 400
    });
  }

  // Check file type
  if (req.file.mimetype !== 'text/csv' && !req.file.originalname.endsWith('.csv')) {
    return res.status(400).json({
      success: false,
      message: 'Only CSV files are allowed',
      statusCode: 400
    });
  }

  // Check file size (max 10MB)
  if (req.file.size > 10 * 1024 * 1024) {
    return res.status(400).json({
      success: false,
      message: 'File size must be less than 10MB',
      statusCode: 400
    });
  }

  next();
};

// Validation schema for book data
export const bookImportSchema = Joi.object({
  title: Joi.string().min(1).max(500).required().messages({
    'string.empty': 'Title is required',
    'string.max': 'Title must be less than 500 characters'
  }),
  author: Joi.string().allow('').max(200).messages({
    'string.max': 'Author name must be less than 200 characters'
  }),
  summary: Joi.string().allow('').max(2000).messages({
    'string.max': 'Summary must be less than 2000 characters'
  }),
  publisher: Joi.string().allow('').max(200).messages({
    'string.max': 'Publisher name must be less than 200 characters'
  }),
  price: Joi.number().min(0).required().messages({
    'number.base': 'Price must be a number',
    'number.min': 'Price must be greater than or equal to 0',
    'any.required': 'Price is required'
  }),
  genre: Joi.string().allow('').max(100).messages({
    'string.max': 'Genre must be less than 100 characters'
  }),
  quantity: Joi.number().integer().min(0).default(1).messages({
    'number.base': 'Quantity must be a number',
    'number.integer': 'Quantity must be an integer',
    'number.min': 'Quantity must be greater than or equal to 0'
  }),
  publishDate: Joi.date().allow(null).messages({
    'date.base': 'Publish date must be a valid date'
  })
});

export default {
  csvImportValidation,
  bookImportSchema
};
