import express from 'express'
import {StatusCodes} from 'http-status-codes'
import {userController} from '~/controllers/userController'

const Router = express.Router()

Router.route('/')
    .get((req, res) => {
        res.status(StatusCodes.OK).json({mess: 'Note: API get get all User of AUTH.', code : StatusCodes.OK})
    })
    .post( userController.createUser)

export const authRouters = Router