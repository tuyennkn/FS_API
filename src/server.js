/**
 * Updated by trungquandev.com's author on August 17 2023
 * YouTube: https://youtube.com/@trungquandev
 * "A bit of fragrance clings to the hand that gives flowers!"
 */
/* eslint-disable */

import express from 'express'
import { CONNECT_DB, CLOSE_DB } from '~/config/mongoose'
import exitHook from 'async-exit-hook'
import cors from 'cors'
import indexRouter from './routes/indexRouter.js'

// ======================
// START SERVER FUNCTION
// ======================
const START_SERVER = () => {
  const app = express()

  // Enable CORS
  app.use(cors())

  // Increase payload size limits
  app.use(express.json({ limit: '50mb' }))
  app.use(express.urlencoded({ limit: '50mb', extended: true }))

  // ======================
  // ROUTES
  // ======================
  app.use('/router', indexRouter)

  // Static files
  app.use(express.static('public'))

  // ======================
  // START LISTENING
  // ======================
  const PORT = 8080

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is running at http://0.0.0.0:${PORT}`)
  })

  // ======================
  // GRACEFUL SHUTDOWN
  // ======================
  exitHook(() => {
    console.log('⏳ Closing database connection...')
    CLOSE_DB()
    console.log('✅ Database connection closed')
  })
}

// ======================
// BOOTSTRAP APPLICATION
// ======================
;(async () => {
  try {
    await CONNECT_DB()
    console.log('✅ Connected to MongoDB Atlas')

    // Cleanup stuck AI reports after database connection
    const { cleanupStuckReports } = await import('./controllers/aiStatisticController.js')
    await cleanupStuckReports()

    START_SERVER()
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
})()