const Food = require('../models/Food');

// Initial Indian Meals + Basics Seed
const initialFoods = [
    { name: 'Biryani (Chicken)', unit_name: '1 plate (300g)', calories: 450, protein: 22, carbs: 55, fats: 15, isGlobal: true },
    { name: 'Curd Rice', unit_name: '1 bowl (200g)', calories: 250, protein: 6, carbs: 35, fats: 8, isGlobal: true },
    { name: 'Chapati', unit_name: '1 piece (40g)', calories: 104, protein: 3, carbs: 18, fats: 1.5, isGlobal: true },
    { name: 'Paneer Butter Masala', unit_name: '1 bowl (150g)', calories: 350, protein: 12, carbs: 15, fats: 25, isGlobal: true },
    { name: 'Masala Dosa', unit_name: '1 dosa', calories: 415, protein: 8, carbs: 65, fats: 12, isGlobal: true },
    { name: 'Idli', unit_name: '1 piece (40g)', calories: 60, protein: 2, carbs: 12, fats: 0.1, isGlobal: true },
    { name: 'Sambar', unit_name: '1 bowl (150g)', calories: 130, protein: 5, carbs: 20, fats: 3, isGlobal: true },
    { name: 'Upma', unit_name: '1 bowl (150g)', calories: 210, protein: 4, carbs: 35, fats: 6, isGlobal: true },
    { name: 'Dal Tadka', unit_name: '1 bowl (150g)', calories: 180, protein: 10, carbs: 22, fats: 5, isGlobal: true },
    { name: 'Chicken Curry', unit_name: '1 bowl (200g)', calories: 280, protein: 25, carbs: 10, fats: 14, isGlobal: true },
    { name: 'Chicken Breast (Grilled)', unit_name: '100g', calories: 165, protein: 31, carbs: 0, fats: 3.6, isGlobal: true },
    { name: 'White Rice (Cooked)', unit_name: '100g', calories: 130, protein: 2.7, carbs: 28, fats: 0.3, isGlobal: true },
    { name: 'Egg (Whole)', unit_name: '1 large', calories: 78, protein: 6, carbs: 0.6, fats: 5, isGlobal: true }
];

// @desc    Get all foods (Searchable)
// @route   GET /api/foods
// @access  Private
const getFoods = async (req, res, next) => {
    try {
        const keyword = req.query.search ? {
            name: {
                $regex: req.query.search,
                $options: 'i'
            }
        } : {};

        // Fetch global foods OR user-created foods
        const query = {
            ...keyword,
            $or: [
                { isGlobal: true },
                { createdBy: req.user.id }
            ]
        };

        const foods = await Food.find(query).sort({ name: 1 });
        res.json(foods);
    } catch (error) {
        next(error);
    }
};

// @desc    Create custom food
// @route   POST /api/foods
// @access  Private
const createFood = async (req, res, next) => {
    try {
        const { name, unit_name, calories, protein, carbs, fats } = req.body;

        const isGlobal = req.user.isAdmin; // Only admins can create global foods
        
        // Check if food already exists (case-insensitive and trimmed)
        const normalizedName = name.trim();
        const foodExists = await Food.findOne({ 
            name: { $regex: new RegExp(`^${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } 
        });

        if (foodExists) {
            res.status(400);
            throw new Error('Food already exists');
        }

        const food = await Food.create({
            name,
            unit_name,
            calories,
            protein,
            carbs,
            fats,
            isGlobal,
            createdBy: isGlobal ? null : req.user.id
        });

        res.status(201).json(food);
    } catch (error) {
        next(error);
    }
};

// @desc    Update food
// @route   PUT /api/foods/:id
// @access  Private/Admin
const updateFood = async (req, res, next) => {
    try {
        const food = await Food.findById(req.params.id);

        if (!food) {
            res.status(404);
            throw new Error('Food not found');
        }

        // Only admins can update global foods. Users can only update their own custom foods.
        if (food.isGlobal && !req.user.isAdmin) {
            res.status(401);
            throw new Error('Not authorized to update global foods');
        }

        if (!food.isGlobal && food.createdBy.toString() !== req.user.id && !req.user.isAdmin) {
            res.status(401);
            throw new Error('Not authorized to update this food');
        }

        const updatedFood = await Food.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.json(updatedFood);
    } catch (error) {
        next(error);
    }
};

// @desc    Delete food
// @route   DELETE /api/foods/:id
// @access  Private/Admin
const deleteFood = async (req, res, next) => {
    try {
        const food = await Food.findById(req.params.id);

        if (!food) {
            res.status(404);
            throw new Error('Food not found');
        }

        if (food.isGlobal && !req.user.isAdmin) {
            res.status(401);
            throw new Error('Not authorized to delete global foods');
        }

        if (!food.isGlobal && food.createdBy.toString() !== req.user.id && !req.user.isAdmin) {
            res.status(401);
            throw new Error('Not authorized to delete this food');
        }

        await food.deleteOne();
        res.json({ message: 'Food removed' });
    } catch (error) {
        next(error);
    }
};

// Internal function to seed DB if empty
const seedFoodsDB = async () => {
    try {
        const count = await Food.countDocuments();
        if (count < 10) { 
            // We'll wipe and re-seed to ensure the new Indian foods are loaded
            await Food.deleteMany({ isGlobal: true });
            await Food.insertMany(initialFoods);
            console.log('Food database updated with Indian meals successfully.');
        }
    } catch (error) {
        console.error('Error seeding foods:', error);
    }
};

module.exports = {
    getFoods,
    createFood,
    updateFood,
    deleteFood,
    seedFoodsDB
};
