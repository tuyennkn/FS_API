import mongoose from 'mongoose'
import { env } from '~/config/environment'

let dbConnection = null

export const CONNECT_DB = async () => {
  try {
    if (!dbConnection) {
      dbConnection = await mongoose.connect(env.MONGODB_URI)
      console.log('✅ Connected to MongoDB using Mongoose!')
    }
    return dbConnection
  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    process.exit(1)
  }
}

export const CLOSE_DB = async () => {
  try {
    await mongoose.disconnect()
    dbConnection = null
    console.log('🔌 Disconnected from MongoDB')
  } catch (error) {
    console.error('❌ Error while disconnecting from MongoDB:', error)
  }
}
