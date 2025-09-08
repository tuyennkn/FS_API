import mongoose from 'mongoose'

const refreshTokenSchema = new mongoose.Schema({
    token: { 
        type: String, 
        required: true, 
        unique: true 
    },
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    expiresAt: { 
        type: Date, 
        required: true 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    deviceInfo: {
        userAgent: String,
        ip: String
    }
}, {
    timestamps: true
})

// Index để tự động xóa token hết hạn
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// Method để kiểm tra token có hết hạn không
refreshTokenSchema.methods.isExpired = function() {
    return Date.now() >= this.expiresAt.getTime()
}

// Static method để tìm và xác thực token
refreshTokenSchema.statics.findValidToken = async function(token) {
    const refreshToken = await this.findOne({ 
        token, 
        isActive: true 
    }).populate('userId')
    
    if (!refreshToken || refreshToken.isExpired()) {
        return null
    }
    
    return refreshToken
}

// Static method để vô hiệu hóa token
refreshTokenSchema.statics.revokeToken = async function(token) {
    return await this.updateOne(
        { token }, 
        { isActive: false }
    )
}

// Static method để vô hiệu hóa tất cả token của user
refreshTokenSchema.statics.revokeAllUserTokens = async function(userId) {
    return await this.updateMany(
        { userId, isActive: true }, 
        { isActive: false }
    )
}

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema)
export default RefreshToken
