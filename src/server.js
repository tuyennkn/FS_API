/**
 * Updated by trungquandev.com's author on August 17 2023
 * YouTube: https://youtube.com/@trungquandev
 * "A bit of fragrance clings to the hand that gives flowers!"
 */
/* eslint-disable */

import express from 'express'
import {env} from '~/config/environment'
import {CONNECT_DB, GET_DB, CLOSE_DB} from '~/config/mongoose'
import exitHook from 'async-exit-hook'
import cors from 'cors'
import mongoose from 'mongoose'
import indexRouter from './routes/indexRouter.js'
import { generateEmbedding, generateBatchEmbeddings } from './services/AI/embedding.service.js'


const START_SERVER = () => {
  const app = express()
  app.use(cors())
  //enable req.body data json
  app.use(express.json())

  const hostname = 'localhost'
  const port = 8080



  app.use('/router', indexRouter)
  
  app.use(express.static('public'))

  // Test embedding endpoint
  app.use('/embed', async (req, res) => {
    
    // call method from embedding service
    generateBatchEmbeddings(["Hello, world!", "Another text to embed"])
    .then(embeddings => {
        res.status(StatusCodes.OK).json({message: 'Batch embeddings generated', code: 200, embeddings})
    })
    .catch(error => {
        res.status(404).json({message: 'Error generating embedding', code: 404, error: error.message})
    })
  })


  app.listen(port, hostname, () => {
    console.log(`Hello ${port} Dev, I am running at ${ hostname }:${ port }`)
  })

  exitHook(() => {
    console.log('chuẩn bị đóng database')
    CLOSE_DB()
    console.log('Đã đóng database')
  })
}
//dạng Anonymuous Function(IIFE): function ẩn danh và chạy liền
(async() => {
  try {
    await CONNECT_DB()
    console.log('ket noi thanh cong toi MongoDB cua Atlas')

    START_SERVER()
  } catch (error) {
    console.error(error)
    process.exit()
  }
})()

// CONNECT_DB()
//   .then( () => console.log('ket noi thanh cong toi MongoDB cua Atlas'))
//   .then( () => START_SERVER())
//   .catch(error => {
//     console.error(error)
//     process.exit()
//   })