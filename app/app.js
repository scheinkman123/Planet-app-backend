require('dotenv').config()
const express = require('express');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const forexRoutes = require('./routes/forexRoutes');
// const userModel = require('./models/userModel');
const forexModel = require('./models/forexModel');
const userController = require("./controllers/userController");
const cron = require('node-cron');
const axios = require('axios');
const cors = require('cors');

// define the cron schedule (run every hour at minute 0)
cron.schedule('0 * * * *', async () => {
  try {
    const preferences = await userController.getUniquePreferences();

    for(const preference of preferences){
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
  
        // if the forex model doesn't exist then create a new else just update the one we already have
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
        // handle errors
        console.error(error);
      });
    }  
  } catch (error) {
    console.log(error);
  }
});


// Create Express app
const app = express();

// Allow cors for cross origin requests
app.use(cors());

// Connect to MongoDB database
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });

// Middleware to parse JSON requests
app.use(express.json());

// Mount user routes
app.use('/users', userRoutes);

// Mount forex routes
app.use('/forex', forexRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(500).json({ message: err.message });
});

// Start server
const port = 3000;
app.listen(port, () => console.log(`Server listening on port ${port}`));
