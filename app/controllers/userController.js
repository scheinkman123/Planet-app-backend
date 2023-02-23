const User = require('../models/userModel');
const forexModel = require('../models/forexModel');
const axios = require('axios');

async function createUser(req, res) {
  try {
    // Check if the email already exists in the database
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Create a new user with an email and password
    const newUser = new User({
      email: req.body.email,
      password: req.body.password
    });

    // Save the new user to database
    await newUser.save();

    // Return a success message
    res.json({ message: 'User created successfully' });
  } catch (err) {
    // Return an error message if something went wrong
    res.status(500).json({ message: err.message });
  }
}

async function loginUser(req, res) {
  try {
    // Find the user by email and password
    const user = await User.findOne({
      email: req.body.email,
      password: req.body.password
    });

    // Return an error message if user is not found
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Return user object
    res.json(user._id);
  } catch (err) {
    // Return an error message if something went wrong
    res.status(500).json({ message: err.message });
  }
}

// Get the user information
async function getUserInfo(req, res) {
  try {
    // Find user by id
    const user = await User.findById(req.params.id);

    // Return an error message if user not found
    if (!user) {
      return res.status(401).json({ message: 'No user found for the given id' });
    }

    // Return user object
    res.json(user);
  } catch (err) {
    // Return an error message if something went wrong
    res.status(500).json({ message: err.message });
  }
}

async function addUserPreference(req, res) {
  try {
    // Find user by id
    const user = await User.findById(req.params.id);
    const preference = req.query.preference;

    // Return an error message if user not found
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // see if user has already subscribed to this preference
    if(user.preferences.includes(preference)){
      return res.status(200).json({ message: 'Preference already exists' });
    }

    // Update user preferences
    user.preferences.push(preference);

    // Save updated user to database
    await user.save();

    // call the alphavantage api to save new data
    try {
    const currencies = preference.split("_");
    const from = currencies[0];
    const to = currencies[1];
    // make an API request using Axios
    axios.get(`https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=${from}&to_symbol=${to}&apikey=${process.env.ALPHA_API_KEY}`)
    .then(async (response) => {
      // calculate today
      const currentDate = new Date().toISOString().slice(0, 10);
  
      // calculate yesterday
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
  
     const yesterdayDate = yesterday.toISOString().slice(0, 10);
  
      // from the response data, single out values for today and yesterday only
      const todayRates = response.data["Time Series FX (Daily)"][currentDate];
      const yesterdayRates = response.data["Time Series FX (Daily)"][yesterdayDate];
  
      // find the forex model
      const forex = await forexModel.findOne({
        exchangeName: preference
     });
  
        // if the forex model doesn't exist then create a new one, else just update the one already created
      if(!forex){
        const newForex = new forexModel({
          exchangeName: preference,
          high: todayRates["2. high"],
          low: todayRates["3. low"],
          highY: yesterdayRates["2. high"],
          lowY: yesterdayRates["3. low"],
        });
  
      await newForex.save();
      }else {
        forex.high = todayRates["2. high"];
        forex.low = todayRates["3. low"];
        forex.highY = yesterdayRates["2. high"];
        forex.lowY = yesterdayRates["3. low"];
  
        await forex.save();
      }
    })
    .catch(error => {
      console.error(error);
    });
    } catch (error) {
      console.log(error);
    }

    // Return a success message
    res.json({ message: 'User preferences updated successfully' });
  } catch (err) {
    // Return an error message if something went wrong
    res.status(500).json({ message: err.message });
  }
}

async function removeUserPreference(req, res) {
  try {
    // Find user by id
    const user = await User.findById(req.params.id);

    // Return an error message if user not found
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user preferences
    user.preferences = user.preferences.filter(item => item !== req.query.preference);

    // Save updated user to database
    await user.save();

    // Return a success message
    res.json({ message: 'User preferences updated successfully' });
  } catch (err) {
    // Return an error message if something went wrong
    res.status(500).json({ message: err.message });
  }
}

async function getUniquePreferences() {
  try {
    // Fetch all users from the database
    const users = await User.find();

    // Extract the preferences array from each user and combine into a single array
    const allPreferences = users.reduce((accumulator, user) => {
      if (user.preferences && user.preferences.length > 0) {
        accumulator.push(...user.preferences);
      }
      return accumulator;
    }, []);

    // Use a Set to remove duplicated preferences and reconvert to an array
    const uniquePreferences = [...new Set(allPreferences)];

    return uniquePreferences;
  } catch (error) {
    console.error(error);
    throw new Error('Unable to fetch unique preferences');
  }
}

module.exports = {
  createUser,
  loginUser,
  addUserPreference,
  removeUserPreference,
  getUniquePreferences,
  getUserInfo
};
