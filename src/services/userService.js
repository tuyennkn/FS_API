/**
 * Updated by trungquandev.com's author on August 17 2023
 * YouTube: https://youtube.com/@trungquandev
 * "A bit of fragrance clings to the hand that gives flowers!"
 */

import User from '~/models/User'

const createUser = async (userData) => { 

    try {
        const user = new User(userData)
        await user.save()
        return user
    } catch (error) {
        console.error('Error creating user:', error)
        throw error
    }
}
export const userService = {
    createUser
}