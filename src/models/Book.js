import e from 'express'
import mongoose from 'mongoose'

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String },
  description: { type: String },
  slug: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
  rating: { type: Number, default: 0 },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'categories' },
  genre: { type: String }, // Thể loại sách thay thế cho category
  embedding: { type: [Number] }, // [] Embedding vector
  quantity: { type: Number, default: 0 },
  sold: { type: Number, default: 0 },
  image: { type: [String] },
  isDisable: { type: Boolean, default: false },
  attributes: {
    isbn: { type: String },
    publisher: { type: String },
    firstPublishDate: { type: Date },
    publishDate: { type: Date },
    pages: { type: Number },
    language: { type: String },
    edition: { type: String },
    bookFormat: { type: String },
    characters: { type: [String] },
    awards: { type: [String] }
  }
}, { timestamps: true })

// Create text index for search functionality
bookSchema.index({ 
  title: 'text', 
  author: 'text', 
  description: 'text',
  genre: 'text'
});

export default mongoose.model('books', bookSchema)
