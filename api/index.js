const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const serverless = require('serverless-http');

const app = express();

app.use(cors());
app.use(express.json());

// Serve static frontend (adjust path for Vercel)
app.use(express.static(path.join(__dirname, '../backend/frontend')));

// API route
app.post('/audit', async (req, res) => {
  const { domain, api_key, email } = req.body;

  if (!domain || !api_key || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const metaResponse = await axios.post('https://api.adyntel.com/facebook', {
      company_domain: domain,
      api_key,
      email
    });

    const googleResponse = await axios.post('https://api.adyntel.com/google', {
      company_domain: domain,
      api_key,
      email
    });

    const metaData = metaResponse.data || {};
    const googleData = googleResponse.data || {};

    res.json({
      meta: {
        page_id: metaData.page_id || null,
        page_url: metaData.results?.[0]?.[0]?.snapshot?.page_profile_uri || 'N/A',
        number_of_ads: metaData.number_of_ads || 0
      },
      google: {
        total_ad_count: googleData.total_ad_count || 0
      }
    });
  } catch (error) {
    console.error('❌ API error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to audit domain' });
  }
});

// Catch-all to serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../backend/frontend', 'index.html'));
});

module.exports = serverless(app);
