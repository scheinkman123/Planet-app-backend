const Forex = require('../models/forexModel');
const User = require('../models/userModel');

// Find Forex data for the user
async function getForexData(req, res) {
  try {
    // Find user by id
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { preferences } = user;

    // If user has no preferences, return an empty array
    if (!preferences || preferences.length === 0) {
      return res.json([]);
    }

    const forexDataPromises = preferences.map(async (exchangeName) => {
      const indForexData = await Forex.findOne({
        exchangeName: exchangeName
      });

      return indForexData ? { exchangeName: indForexData.exchangeName, high: indForexData.high, low: indForexData.low, highY: indForexData.highY, lowY: indForexData.lowY } : null;
    });

    const forexData = await Promise.all(forexDataPromises);

    return res.json(forexData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  getForexData
};