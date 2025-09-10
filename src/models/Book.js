import mongoose from 'mongoose'

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String },
  summary: { type: String },
  publisher: { type: String },
  price: { type: Number, required: true },
  rating: { type: Number, default: 0 },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  genre: { type: String }, // Thể loại sách thay thế cho category_id
  summaryvector: { type: [Number] }, // [] Embedding vector
  quantity: { type: Number, default: 0 },
  sold: { type: Number, default: 0 },
  imageUrl: { type: String },
  publishDate: { type: Date }, // Ngày xuất bản
  isDisable: { type: Boolean, default: false }
}, { timestamps: true })

export default mongoose.model('Book', bookSchema)
