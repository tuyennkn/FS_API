import mongoose from 'mongoose'

const commentSchema = new mongoose.Schema({
  book_id: { type: mongoose.Schema.Types.ObjectId, ref: 'books', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  rating: { type: Number, min: 1, max: 5 },
  content: { type: String }
}, { timestamps: true })

export default mongoose.model('Comment', commentSchema)
