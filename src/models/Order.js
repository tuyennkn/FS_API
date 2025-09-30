import mongoose from 'mongoose'

const orderSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  items: [{
    book_id: { type: mongoose.Schema.Types.ObjectId, ref: 'books', required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  total_price: { type: Number, required: true },
  payment_type: { type: String, required: true }
}, { timestamps: true })

export default mongoose.model('orders', orderSchema)
