const express = require('express');
const router = express.Router();
const forexController = require('../controllers/forexController');

router.get('/:userId', forexController.getForexData);

module.exports = router;