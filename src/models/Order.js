import mongoose from 'mongoose'

const orderSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  items: [{
    book_id: { type: mongoose.Schema.Types.ObjectId, ref: 'books', required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  total_price: { type: Number, required: true },
  shipping_fee: { type: Number, default: 0 },
  shipping_address: { type: String, required: true },
  shipping_phone_number: { type: String, required: true },
  payment_type: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled'], 
    default: 'pending' 
  }
}, { timestamps: true })

export default mongoose.model('orders', orderSchema)
