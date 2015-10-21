/*
YA voy pillando la cosa. El index -> session -> account es para el usuario
AHORA MISMO FUNCIONA: Al darle a authorise, redirectUri tiene que ser una ruta que haga un POST (*) a /oauth/token con
client_id, client_secret, grant_type (authorization_code) y code (el authCode que devuelve el authorise).
La respuesta es del tipo: 
  {
    token_type: "bearer"
    access_token: "6d9d1373a1a02c6b219fc7f0beeb9cd719cf00ef"
    expires_in: 3600
    refresh_token: "dd570447164c2bb84ee3f6c9cfcff07548e79140"
  }

Guardar la info. Y cualquier llamada en la que incluya como middleware oauth.authorise() hay que añadir como parámetros
el access_token (ya sea GET o POST)

(*) http://stackoverflow.com/questions/17612695/expressjs-how-to-redirect-a-post-request-with-parameters

Cuando expira el accessToken hay que conseguir uno nuevo a partir del refreshToken. Es un POST a /oauth/token con 
client_id, client_secret, grant_type (refresh_token) y refresh_token (el guardado la última vez). La respuesta es
igual que se consigue para el accessToken.
*/


var express     = require('express'),
  cookieSession = require('cookie-session')
  bodyParser    = require('body-parser'),
  path          = require('path');
  oauthserver   = require('oauth2-server'),
  mongoose      = require('mongoose'),
  model         = require('./models/model'),
  middleware    = require('./middleware'),
  logger        = require('morgan');

var dbUri = process.env.MONGOLAB_URI || 'mongodb://localhost/oauthServer';
mongoose.connect(dbUri);

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(cookieSession({
  name: 'session',
  keys: ['keySession']
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(logger('dev'));

app.oauth = oauthserver({
  model: require('./models/model.js'),
  grants: ['authorization_code', 'refresh_token'],
  debug: true
});

// Handle token grant requests
app.all('/oauth/token', app.oauth.grant());

app.get('/', middleware.loadUser, function (req, res) {
  res.render('index');
});

// Show them the "do you authorise xyz app to access your content?" page
app.get('/oauth/authorise', function (req, res, next) {
  if (!req.session.user) {
    // If they aren't logged in, send them to your own login implementation
    return res.redirect('/login?redirect=' + req.path + '&client_id=' +
        req.query.client_id + '&redirect_uri=' + req.query.redirect_uri);
  }

  res.render('authorise', {
    client_id: req.query.client_id,
    redirect_uri: req.query.redirect_uri
  });
});

// Handle authorise
app.post('/oauth/authorise', function (req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login?client_id=' + req.body.client_id + "&redirect_uri=" + req.body.redirect_uri);
  }

  next();
}, app.oauth.authCodeGrant(function (req, next) {
  // First param: indicate an error
  // Second param: bool indicating if the user did authorise the app
  // Third param: the user/uid (only used for passing to SaveAuthCode)
  next(null, req.body.allow === 'yes', req.session.user._id, null);
}));

// Show login
app.get('/login', function (req, res, next) {
  res.render('login', {
    redirect: req.query.redirect,
    client_id: req.query.client_id,
    redirect_uri: req.query.redirect_uri
  });
});

// Handle login
app.post('/login', function (req, res, next) {
  // Insert your own login mechanism CAMBIARÁ, ESTO SOLO VALE PARA UN USUARIO
  model.getUser(req.body.email, function (err, user) {
    if (err)
      return next(err);
    if (user) {
      if (user.email !== 'smendez@erizzo.es') {
        res.render('login', {
          redirect: req.query.redirect,
          client_id: req.query.client_id,
          redirect_uri: req.query.redirect_uri
        });
      } else {
        // Successful logins should send the user back to the /oauth/authorise
        // with the client_id and redirect_uri (you could store these in the session)
        req.session.user = user;
        req.session.client_id = req.query.client_id;
        req.session.redirect_uri = req.query.redirect_uri;
        query = '?client_id=' + req.query.client_id + '&redirect_uri=' + req.query.redirect_uri;
        return res.redirect((req.query.redirect || '/oauth/authorise') + query);
      }
    }
  });
});

app.get('/account', middleware.requiresUser, function (req, res, next) {
  model.getUser(req.session.userId, function (err, user) {
    if (err)
      return next(err);
    if (!user) {
      var error = {
        code: 404,
        message: 'User not found'
      }
      return next(Error.call(error));
    }
      
    res.render('account', { user: user });
  })
});

app.get('/session', function (req, res, next) {
  res.render('login');
});

app.post('/session', function (req, res, next) {
  model.getUser(req.body.email, function (err, user) {
    if (err)
      return next(err);

    if (user) {
      req.session.userId = req.body.email;
      return res.redirect((req.query.redirect || '/account'));
    } else {
      res.status(401).render('login');
    }
  })
});

app.get('/secret', app.oauth.authorise(), function (req, res) {
  // Will require a valid access_token
  req.session.accessToken = req.query.access_token;
  res.send('Secret Area. AccessToken=' + req.session.accessToken);
});

app.get('/public', function (req, res) {
  // Does not require access_token
  res.send('Public Area');
});

// TEST - Save users
app.post('/client', function (req, res) {
  var body = req.body;
  model.saveClient(body.clientId, body.clientSecret, body.redirectUri, function (err, saved) {
    if (err)
      res.send(err);

    res.json(saved);
  });
});

// Save clients
app.post('/user', function (req, res) {
  var body = req.body;
  model.saveUser(body.username, body.password, body.firstname, body.lastname, body.email, function (err, saved) {
    if (err)
      res.send(err);

    res.json(saved);
  });
});
// END TEST

// Error handling
app.use(app.oauth.errorHandler());

app.listen(3000);