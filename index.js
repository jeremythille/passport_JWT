
const port = 8000;
const express = require('express');
const app = express();
const bodyParser = require('body-parser'); // <----- Required for Passport (but not mentioned in the docs)
const jwt = require('jwt-simple');

const passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy;

const User = require('./server_modules/mongo')

const tokenSecret = 'put-a-$Ecr3t-h3re';

passport.authenticationMiddleware = (req, res, next) => {

	console.log("req.headers.token = ", req.headers.token)

	let decoded;

	try {
		decoded = jwt.decode(req.headers.token, tokenSecret);
	} catch (e) {
		console.error("Auth middleware : Error decoding token. ~~~~~~~~~~")
		return res.redirect('/login')
	}

	console.log("decoded = ", decoded)

	user = User
			.findById(decoded.id)
			.exec( (err, user) => {
				if (user) {
					console.info("Auth middleware : authorised :)  ~~~~~~~~")
					return next()
				}

				console.error("Auth middleware : not auth! ~~~~~~~~~~")
				res.redirect('/login')
			})
}


app
	.use(express.static(__dirname))
	.use(bodyParser.urlencoded({ // <----- Required for Passport (but not mentioned in the docs)
		extended: false
	})) 
	.use(passport.initialize()) // <---------------- Don't forget this!!

app
	.get('/login', (req, res) => {
		console.log((new Date()).toString().substr(16, 8) + " - Hit GET login route ")
		res.sendFile(__dirname + '/login.html')
	})
	.get('/logout', (req, res) => {
		req.logout();
		res.redirect('/loggedOut');
	})
	.get('/badLogin', (req, res) => {
		console.log("Bad login !")
		res.send('<h1>Wrong credentials!</h1>')
	})
	.get('/loggedOut', (req, res) => {
		res.sendFile(__dirname + '/loggedOut.html')
	})
	.get('/secret', (req, res) => {
		res.sendFile(__dirname + '/secret.html')
	})
	.get('/secretContent',

		passport.authenticationMiddleware,

		(req, res) => {
			res.status(200).send('Secret image!<br><img src="http://www.minionland.com/wp-content/uploads/2015/10/minion-stuart-dance-gif-1445349814n84gk.gif"/><br><br>')
		})

app.listen(port, () => {
	console.log("App listening on port " + port)
})


passport.use(new LocalStrategy(
	(username, password, done) => {
		console.log("Username and password : ", username, password)

		User.findOne({ username: username, password: password }, (err, user) => {
			if (err) return done(err);

			if (!user) {
				console.log("LocalStrategy : Incorrect username or password.")
				return done(null, false, { message: 'Incorrect username or password.' });
			}
			console.log('Correct login :)')
			return done(null, user);
		});
	}
));

app.post('/login', passport.authenticate('local', {
	successRedirect: '/secret',
	failureRedirect: '/badLogin'
}), (req, res) => {
	// If this function gets called, authentication was successful.
	// `req.user` contains the authenticated user.
	console.log("Login successful!")
	res.redirect('/');
});


// ---------------- Making a token and sending it to the client

app.post('/token',

	passport.authenticate('local', {
		session: false
	}), // First, authenticates with username and password. If successful, creates a token

	(req, res) => {

		// If this function gets called, authentication was successful.
		// `req.user` contains the authenticated user, without his token yet.

		console.log("Login with password successful! Now creating token", req.user)

		let token = jwt.encode({
			id: req.user.id
		}, tokenSecret); // const tokenSecret = 'put-a-$Ecr3t-h3re';

		res.status(200).json({ token: token });
	});