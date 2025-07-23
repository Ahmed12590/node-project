const express = require('express');
const axios = require('axios');
const serverless = require('serverless-http');
require('dotenv').config();

const app = express();

app.use(express.json());

app.post('/api/audit', async (req, res) => {
  const { domain } = req.body;

  const api_key = process.env.API_KEY;
  const email = process.env.EMAIL;

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

module.exports = serverless(app);
