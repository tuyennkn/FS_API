import express from 'express'
import {StatusCodes} from 'http-status-codes'
import authRouters from './authRouters.js'
import categoryRouter from './category/categoryRouter.js'
import bookRouter from './book/bookRouter.js'
import commentRouter from './comment/commentRouter.js'

const Router = express.Router()
Router.use('/auth', authRouters)
Router.use('/category', categoryRouter)
Router.use('/book', bookRouter)
Router.use('/comment', commentRouter)

// Kiểm tra status API
Router.get('/status', (req, res) => {
    res.status(StatusCodes.OK).json({message: 'APIs are ready', code: StatusCodes.OK})
})

export default Router
