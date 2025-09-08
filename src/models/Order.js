import mongoose from 'mongoose'

const orderSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  books: [{
    book_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    quantity: { type: Number, required: true }
  }],
  price: { type: Number, required: true },
  payment_type: { type: String}
}, { timestamps: true })

export default mongoose.model('Order', orderSchema)
