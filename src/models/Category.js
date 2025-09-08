import mongoose from 'mongoose'

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  isDisable: { type: Boolean, default: false }
}, { timestamps: true })

export default mongoose.model('Category', categorySchema)
