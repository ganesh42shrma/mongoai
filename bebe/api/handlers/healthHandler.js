const { getModelInfo } = require('../../lib/llm');

module.exports = async (req, res) => {
  const { model, useGroq } = getModelInfo();
  res.json({ status: 'ok', model, useGroq, user: req.user });
};
