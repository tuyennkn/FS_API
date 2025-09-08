import mongoose from 'mongoose'

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String },
  summary: { type: String },
  publisher: { type: String },
  price: { type: Number, required: true },
  rating: { type: Number, default: 0 },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  summaryvector: { type: String },
  quantity: { type: Number, default: 0 },
  sold: { type: Number, default: 0 },
  isDisable: { type: Boolean, default: false }
}, { timestamps: true })

export default mongoose.model('Book', bookSchema)
