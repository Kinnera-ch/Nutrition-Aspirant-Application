const Meal = require('../models/Meal');
const Food = require('../models/Food');

// @desc    Get meals
// @route   GET /api/meals
// @access  Private
const getMeals = async (req, res, next) => {
    try {
        // Find meals and populate the foodItemId to get the food name
        const meals = await Meal.find({ user: req.user.id }).sort({ date: -1 });
        res.json(meals);
    } catch (error) {
        next(error);
    }
};

// @desc    Set meal
// @route   POST /api/meals
// @access  Private
const setMeal = async (req, res, next) => {
    try {
        const { foodItemId, quantity, mealType } = req.body;

        // Fetch food item to calculate macros
        const food = await Food.findById(foodItemId);
        if (!food) {
            res.status(404);
            throw new Error('Food item not found');
        }

        const calculatedCalories = Math.round(food.calories * quantity);
        const calculatedProtein = Math.round(food.protein * quantity * 10) / 10;
        const calculatedCarbs = Math.round(food.carbs * quantity * 10) / 10;
        const calculatedFats = Math.round(food.fats * quantity * 10) / 10;

        const meal = await Meal.create({
            user: req.user.id,
            foodItemId,
            name: food.name,
            quantity,
            mealType: mealType || 'Snack',
            calories: calculatedCalories,
            protein: calculatedProtein,
            carbs: calculatedCarbs,
            fats: calculatedFats
        });

        res.status(201).json(meal);
    } catch (error) {
        next(error);
    }
};

// @desc    Update meal
// @route   PUT /api/meals/:id
// @access  Private
const updateMeal = async (req, res, next) => {
    try {
        const meal = await Meal.findById(req.params.id);

        if (!meal) {
            res.status(404);
            throw new Error('Meal not found');
        }

        // Check for user
        if (meal.user.toString() !== req.user.id) {
            res.status(401);
            throw new Error('User not authorized');
        }

        const { foodItemId, quantity, mealType } = req.body;
        
        let updateData = { quantity, mealType };

        // If food or quantity changed, recalculate
        if (foodItemId || quantity) {
            const foodIdToUse = foodItemId || meal.foodItemId;
            const quantityToUse = quantity || meal.quantity;
            
            const food = await Food.findById(foodIdToUse);
            if (!food) {
                res.status(404);
                throw new Error('Food item not found');
            }

            updateData.foodItemId = foodIdToUse;
            updateData.name = food.name;
            updateData.quantity = quantityToUse;
            updateData.calories = Math.round(food.calories * quantityToUse);
            updateData.protein = Math.round(food.protein * quantityToUse * 10) / 10;
            updateData.carbs = Math.round(food.carbs * quantityToUse * 10) / 10;
            updateData.fats = Math.round(food.fats * quantityToUse * 10) / 10;
        }

        const updatedMeal = await Meal.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        res.json(updatedMeal);
    } catch (error) {
        next(error);
    }
};

// @desc    Delete meal
// @route   DELETE /api/meals/:id
// @access  Private
const deleteMeal = async (req, res, next) => {
    try {
        const meal = await Meal.findById(req.params.id);

        if (!meal) {
            res.status(404);
            throw new Error('Meal not found');
        }

        // Check for user
        if (meal.user.toString() !== req.user.id) {
            res.status(401);
            throw new Error('User not authorized');
        }

        await meal.deleteOne();

        res.json({ id: req.params.id });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getMeals,
    setMeal,
    updateMeal,
    deleteMeal
};
