const { getModelInfo } = require('../../lib/llm');

module.exports = (req, res) => {
  const { model, useGroq } = getModelInfo();
  res.json({ status: 'ok', model, useGroq });
};