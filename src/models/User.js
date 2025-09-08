import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  fullname: { type: String, required: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  gender: { type: String, required: true },
  birthday: { type: Date, required: true },
  avatar: { type: String, required: true },
  persona: { type: String },
  address: { type: String, required: true },
  role: { type: String, default: 'user' }
}, {
  timestamps: true
})

// Hash password trước khi lưu
userSchema.pre('save', async function(next) {
  try {
    // Nếu password không thay đổi thì bỏ qua
    if (!this.isModified('password')) return next()

    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (err) {
    next(err)
  }
})

userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password)
}

const User = mongoose.model('User', userSchema)
export default User
