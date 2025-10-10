import express from 'express'
import {StatusCodes} from 'http-status-codes'
import authRouters from './auth/authRouters.js'
import categoryRouter from './category/categoryRouter.js'
import bookRouter from './book/bookRouter.js'
import commentRouter from './comment/commentRouter.js'
import uploadRouter from './upload/uploadRouter.js'
import pendingCategoryRoutes from './category/pendingCategoryRoutes.js'
import cartRouter from './cart/cartRouter.js'
import orderRouter from './order/orderRouter.js'
import userRouter from './user/userRouter.js'
import importRouter from './import/importRouter.js'
import adminRouter from './admin/adminRouter.js'
import statisticRouter from './statistic/statisticRouter.js'

const Router = express.Router()
Router.use('/auth', authRouters)
Router.use('/category', categoryRouter)
Router.use('/book', bookRouter)
Router.use('/comment', commentRouter)
Router.use('/upload', uploadRouter)
Router.use('/pending-categories', pendingCategoryRoutes)
Router.use('/cart', cartRouter)
Router.use('/order', orderRouter)
Router.use('/import', importRouter)
Router.use('/user', userRouter)
Router.use('/admin', adminRouter)
Router.use('/statistics', statisticRouter)

// Kiểm tra status API
Router.get('/status', (req, res) => {
    res.status(StatusCodes.OK).json({message: 'APIs are ready', code: StatusCodes.OK})
})


export default Router
