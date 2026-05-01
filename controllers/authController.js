const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// Helper to calculate target calories based on goal
const getTargetCalories = (goal) => {
    switch (goal) {
        case 'weight_loss': return 1700;
        case 'fat_loss': return 1600;
        case 'muscle_gain': return 2400;
        case 'weight_gain': return 2300;
        case 'maintain': return 2000;
        case 'improve_fitness': return 2200;
        case 'balanced_diet': return 2000;
        case 'high_protein_diet': return 2100;
        default: return 2000;
    }
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
    try {
        const { name, email, password, age, weight, goal } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });

        if (userExists) {
            res.status(400);
            throw new Error('User already exists');
        }

        const targetCalories = getTargetCalories(goal || 'maintain');

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            age: age || null,
            weight: weight || null,
            goal: goal || 'maintain',
            targetCalories
        });

        if (user) {
            res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                age: user.age,
                weight: user.weight,
                goal: user.goal,
                targetCalories: user.targetCalories,
                isAdmin: user.isAdmin,
                token: generateToken(user._id),
            });
        } else {
            res.status(400);
            throw new Error('Invalid user data');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Check for user email
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                age: user.age,
                weight: user.weight,
                goal: user.goal,
                targetCalories: user.targetCalories,
                isAdmin: user.isAdmin,
                token: generateToken(user._id),
            });
        } else {
            res.status(401);
            throw new Error('Invalid credentials');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        if (user) {
            user.name = req.body.name || user.name;
            user.age = req.body.age || user.age;
            user.weight = req.body.weight || user.weight;
            
            if (req.body.goal) {
                user.goal = req.body.goal;
                user.targetCalories = getTargetCalories(req.body.goal);
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                age: updatedUser.age,
                weight: updatedUser.weight,
                goal: updatedUser.goal,
                targetCalories: updatedUser.targetCalories,
                isAdmin: updatedUser.isAdmin,
                token: generateToken(updatedUser._id),
            });
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    } catch (error) {
        next(error);
    }
};

module.exports = {
    registerUser,
    loginUser,
    updateProfile
};
