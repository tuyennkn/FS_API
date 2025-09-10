import { uploadSingleImage, deleteImage } from '~/config/cloudinary.js'
import { sendSuccess, sendError, sendBadRequest } from '~/utils/responseHelper.js'
import { MESSAGES } from '~/utils/constants.js'

/**
 * Upload image controller
 */
export const uploadController = {
  /**
   * Upload single image
   */
  uploadImage: (req, res) => {
    uploadSingleImage(req, res, (err) => {
      if (err) {
        console.error('Upload error:', err)
        
        if (err.code === 'LIMIT_FILE_SIZE') {
          return sendBadRequest(res, 'File size too large. Maximum size is 5MB.')
        }
        
        if (err.message === 'Only image files are allowed!') {
          return sendBadRequest(res, 'Only image files are allowed.')
        }
        
        return sendError(res, 'Image upload failed', err.message)
      }

      if (!req.file) {
        return sendBadRequest(res, 'No image file provided')
      }

      // Return the uploaded image information
      const imageData = {
        url: req.file.path, // Cloudinary URL
        publicId: req.file.filename, // Cloudinary public ID
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      }

      sendSuccess(res, imageData, 'Image uploaded successfully')
    })
  },

  /**
   * Delete image
   */
  deleteImage: async (req, res) => {
    try {
      const { publicId } = req.body

      if (!publicId) {
        return sendBadRequest(res, 'Public ID is required')
      }

      const result = await deleteImage(publicId)
      
      if (result.result === 'ok') {
        sendSuccess(res, { deleted: true }, 'Image deleted successfully')
      } else {
        sendError(res, 'Failed to delete image')
      }
    } catch (error) {
      console.error('Delete image error:', error)
      sendError(res, MESSAGES.ERROR.INTERNAL_SERVER_ERROR, error.message)
    }
  }
}