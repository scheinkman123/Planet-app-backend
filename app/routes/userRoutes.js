const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Create a new user with a unique email and password
router.post('/signup', userController.createUser);

// Log in with a username and password
router.post('/login', userController.loginUser);

// Get user data
router.get('/:id', userController.getUserInfo);

// Add user preference
router.post('/:id/add_preference', userController.addUserPreference);

// Remove user preference
router.post('/:id/remove_preference', userController.removeUserPreference);


module.exports = router;
