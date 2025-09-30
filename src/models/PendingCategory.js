import mongoose from 'mongoose'

const pendingCategorySchema = new mongoose.Schema({
  ai_recommended_name: { type: String, required: true, unique: true },
  ai_recommended_description: { type: String },
  book_id: { type: mongoose.Schema.Types.ObjectId, ref: 'books', required: true },
  book_data: {
    title: { type: String, required: true },
    author: { type: String, required: true },
    genre: { type: String, required: true },
    image: { type: [String], required: true }
    },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
  review_notes: { type: String },
  isDisable: { type: Boolean, default: false }
}, { timestamps: true })

export default mongoose.model('pending_categories', pendingCategorySchema)
