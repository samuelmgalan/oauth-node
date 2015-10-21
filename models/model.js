var mongoose = require('mongoose'),
  Schema     = mongoose.Schema,
  model      = module.exports;

// Schema definitions
var OAuthAuthCodesSchema = new Schema({
  authCode: { type: String, unique: true },
  clientId: { type: String },
  userId: { type: String },
  expires: { type: Date }
});

var OAuthAccessTokensSchema = new Schema({
  accessToken: { type: String, unique: true },
  clientId: { type: String },
  userId: { type: String },
  expires: { type: Date }
});

var OAuthRefreshTokensSchema = new Schema({
  refreshToken: { type: String, unique: true },
  clientId: { type: String },
  userId: { type: String },
  expires: { type: Date }
});

var OAuthClientsSchema = new Schema({
  clientId: { type: String },
  clientSecret: { type: String },
  redirectUri: { type: String }
});

var OAuthUsersSchema = new Schema({
  username: { type: String },
  password: { type: String },
  firstname: { type: String },
  lastname: { type: String },
  email: { type: String, default: '' }
});

mongoose.model('OAuthAuthCodes', OAuthAuthCodesSchema);
mongoose.model('OAuthAccessTokens', OAuthAccessTokensSchema);
mongoose.model('OAuthRefreshTokens', OAuthRefreshTokensSchema);
mongoose.model('OAuthClients', OAuthClientsSchema);
mongoose.model('OAuthUsers', OAuthUsersSchema);

var OAuthAuthCodeModel     = mongoose.model('OAuthAuthCodes'),
  OAuthAccessTokensModel   = mongoose.model('OAuthAccessTokens'),
  OAuthRefreshTokensModel  = mongoose.model('OAuthRefreshTokens'),
  OAuthClientsModel        = mongoose.model('OAuthClients'),
  OAuthUsersModel          = mongoose.model('OAuthUsers');

// oauth2-server callbacks
model.getAuthCode = function (authCode, callback) {
  console.log('in getAuthCode (authCode: ' + authCode + ')');

  OAuthAuthCodeModel.findOne({ authCode: authCode }, callback);
}

model.getAccessToken = function (bearerToken, callback) {
  console.log('in getAccessToken (bearerToken: ' + bearerToken + ')');

  OAuthAccessTokensModel.findOne({ accessToken: bearerToken }, callback);
};

model.getClient = function (clientId, clientSecret, callback) {
  console.log('in getClient (clientId: ' + clientId + ', clientSecret: ' + clientSecret + ')');

  if (clientSecret === null) {
    return OAuthClientsModel.findOne({ clientId: clientId }, callback);
  }

  OAuthClientsModel.findOne({ clientId: clientId, clientSecret: clientSecret }, callback);
};

model.getUser = function (email, callback) {
  OAuthUsersModel.findOne({ email: email }, callback);
};

model.grantTypeAllowed = function (clientId, grantType, callback) {
  console.log('in grantTypeAllowed (clientId: ' + clientId + ', grantType: ' + grantType + ')');

  if (grantType == 'refresh_token')
    return callback(false, true);

  return callback(false, true);
};

// TEST
model.saveUser = function (username, password, firstname, lastname, email, callback) {
  console.log('in saveUser (username: ' + username + ', password: ' + password + ', firstname: ' + firstname + 
                ', lastname: ' + lastname + ', email: ' + email + ')');

  var user = new OAuthUsersModel({
    username: username,
    password: password,
    firstname: firstname,
    lastname: lastname,
    email: email
  });

  user.save(callback);
};

model.saveClient = function (clientId, clientSecret, redirectUri, callback) {
  console.log('in saveClient (clientId: ' + clientId + ', clientSecret: ' + clientSecret + 
              ', redirectUri: ' + redirectUri + ')');

  var client = new OAuthClientsModel({
    clientId: clientId,
    clientSecret: clientSecret,
    redirectUri: redirectUri
  });

  client.save(callback);
};
// END TEST
model.saveAuthCode = function (code, clientId, expires, userId, callback) {
  console.log('in saveAuthCode (token: ' + code + ', clientId: ' + clientId + ', userId: ' + userId + 
              ', expires: ' + expires + ')');

  var authToken = new OAuthAuthCodeModel({
    authCode: code,
    clientId: clientId,
    userId: userId,
    expires: expires
  });

  authToken.save(callback);
};

model.saveAccessToken = function (token, clientId, expires, userId, callback) {
  console.log('in saveAccessToken (token: ' + token + ', clientId: ' + clientId +
               ', userId: ' + userId + ', expires: ' + expires + ')');

  var accessToken = new OAuthAccessTokensModel({
    accessToken: token,
    clientId: clientId,
    userId: userId,
    expires: expires
  });

  accessToken.save(callback);
};

// Required to support refresh-token grant type

model.saveRefreshToken = function (token, clientId, expires, userId, callback) {
  console.log('in saveRefreshToken (token: ' + token + ', clientId: ' + clientId +
               ', userId: ' + userId + ', expires: ' + expires + ')');

  var refreshToken = new OAuthRefreshTokensModel({
    refreshToken: token,
    clientId: clientId,
    userId: userId,
    expires: expires
  });

  refreshToken.save(callback);
};

model.getRefreshToken = function (refreshToken, callback) {
  console.log('in getRefreshToken (refreshToken: ' + refreshToken + ')');

  OAuthRefreshTokensModel.findOne({ refreshToken: refreshToken }, callback);
};