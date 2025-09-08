/**
 * Updated by trungquandev.com's author on August 17 2023
 * YouTube: https://youtube.com/@trungquandev
 * "A bit of fragrance clings to the hand that gives flowers!"
 */
/* eslint-disable */
import express from 'express'
import {StatusCodes} from 'http-status-codes'
import {authRouters} from '~/routes/auth/authRoute'
const Router = express.Router()

Router.get('/status', (req, res) =>{
    res.status(StatusCodes.OK).json({mess: 'APIs V1 are ready to usr.', code : StatusCodes.OK})
})

//DÙNG LẠI CÁC API CUA AUTH
Router.use('/auth', authRouters)

export const API_AUTH =Router