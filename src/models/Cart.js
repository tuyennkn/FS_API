import mongoose from 'mongoose'

const cartSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true, unique: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'books', required: true },
    quantity: { type: Number, required: true, min: 1 }
  }],
  total_items: { type: Number, default: 0 },
  total_price: { type: Number, default: 0 }
}, { timestamps: true })

// Calculate totals before saving
cartSchema.pre('save', function() {
  this.total_items = this.items.reduce((sum, item) => sum + item.quantity, 0)
})

export default mongoose.model('carts', cartSchema)