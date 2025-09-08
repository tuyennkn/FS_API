import mongoose from 'mongoose'

const commentSchema = new mongoose.Schema({
  book_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, min: 1, max: 5 },
  content: { type: String }
}, { timestamps: true })

export default mongoose.model('Comment', commentSchema)
