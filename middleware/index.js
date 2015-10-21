var model = require('../models/model');

function requiresUser (req, res, next) {
  if (req.session.userId) {
    req.user = { id: req.session.userId };
    next();
  } else {
    res.app.oauth.authorise()(req, res, next);
  }
}

function loadUser (req, res, next) {
  model.getUser(req.session.userId, function (err, user) {
    if (err)
      return next(err);
    res.locals.user = user;
    next();
  });
}

module.exports.requiresUser = requiresUser;
module.exports.loadUser     = loadUser;