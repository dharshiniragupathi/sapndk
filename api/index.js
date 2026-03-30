const app = require('../backend/src/app');

// Important for Vercel Serverless Functions
module.exports = (req, res) => {
  return app(req, res);
};
