/**
 * Updated by trungquandev.com's author on August 17 2023
 * YouTube: https://youtube.com/@trungquandev
 * "A bit of fragrance clings to the hand that gives flowers!"
 */

import User from '../models/User.js'

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

const getUserById = async (userId) => {
    try {
        const user = await User.findById(userId)
        return user
    } catch (error) {
        console.error('Error getting user by ID:', error)
        throw error
    }
}

const updateUser = async (userId, updateData) => {
    try {

        // Check permission here if userId matches the authenticated user's ID, or if the user has admin rights
        const user = await User.findById(userId)
        if (!user) {
            return null // User not found
        }

        // Remove passsword field if present in updateData to prevent password updates here
        if (updateData.password) {
            delete updateData.password
        }

        // Update user fields
        Object.assign(user, updateData)
        await user.save()
        return user
    } catch (error) {
        console.error('Error updating user:', error)
        throw error
    }
}

const updateUserByAdmin = async (userId, updateData) => {
    try {

        // Admin can update any user
        const user = await User.findById(userId)
        if (!user) {
            return null // User not found
        }

        // Remove passsword field if present in updateData to prevent password updates here
        if (updateData.password) {
            delete updateData.password
        }
        
        // Update user fields
        Object.assign(user, updateData)
        await user.save()
        return user
    } catch (error) {
        console.error('Error updating user by admin:', error)
        throw error
    }
}

const getAllUsers = async (page = 1, limit = 10, search = '') => {
    try {
        const skip = (page - 1) * limit;
        
        // Build search query
        const searchQuery = {};
        if (search) {
            searchQuery.$or = [
                { fullname: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } }
            ];
        }
        
        const users = await User.find(searchQuery)
            .select('-password') // Exclude password
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
            
        const total = await User.countDocuments(searchQuery);
        
        return {
            users,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    } catch (error) {
        console.error('Error getting all users:', error)
        throw error
    }
}

const updateUserPersona = async (userId, persona) => {
    try {
        const user = await User.findById(userId)
        if (!user) {
            return null
        }
        user.persona = persona
        await user.save()
        return user
    } catch (error) {
        console.error('Error updating user persona:', error)
        throw error
    }
}

export const userService = {
    createUser,
    getUserById,
    updateUser,
    updateUserByAdmin,
    getAllUsers,
    updateUserPersona
}