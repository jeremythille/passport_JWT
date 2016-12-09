// const User = require('./server_modules/mongo')

const port = 8000;
const express = require('express');
const app = express();
const util = require('util');
const bodyParser = require('body-parser'); // <----- Required for Passport (but not mentioned in the docs)
const jwt = require('jwt-simple');

const passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy;

var users = [
	{
		id: "123456",
		username: "jer",
		password: "toto"
	},
	{
		id: "987654",
		username: "joe",
		password: "moon"
	},
	{
		id: "654987",
		username: "mike",
		password: "123456789"
	}
]

const tokenSecret = 'put-a-$Ecr3t-h3re';


User = {
	find: (username, password) => {
		return users.find((user) => {
			return user.username === username && user.password === password
		})
	},

	findById: (id) => {
		return users.find((user) => {
			return user.id === id
		})
	},

	findOrCreate: (googleId) => {
		let user = users.find((user) => {
			return user.googleId === googleId
		})

		if (user) {
			return user;
		} else {
			user = {
				id: "4568979",
				googleId: googleId
			}
			users.push(user);
			return user;
		}
	}
}

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

	user = User.findById(decoded.id);

	if (user) {
		console.info("Auth middleware : authorised :)  ~~~~~~~~")
		return next()
	}

	console.error("Auth middleware : not auth! ~~~~~~~~~~")
	res.redirect('/login')
}


app
	.use(express.static(__dirname))
	.use(bodyParser.urlencoded({
		extended: false
	})) // <----- Required for Passport (but not mentioned in the docs)
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
	.get('/badLogin', (req, res) => res.send('<h1>Wrong credentials!</h1>'))
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



// ------------------- LOGIN WITH PASSWORD ------------------------

passport.use(new LocalStrategy( // Reminder : LocalStrategy = require('passport-local').Strategy
	(username, password, done) => {

		console.log("Username and password : ", username, password)

		let user = User.find(username, password)
		done(false, user || false)

		/* MONGO

		User.findOne({ username: username, password: password }, (err, user) => {
			if (err) { return done(err); }

			if (!user) {
				console.log("LocalStrategy : Incorrect username or password.")
				return done(null, false, { message: 'Incorrect username or password.' });
			}
			console.log('Correct login :)')
			return done(null, user);
		});

		*/
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


// ---------------- LOGIN with JWT (jwt-simple)

createToken = (id, cb) => {

	let user = User.findById(id);

	let token = jwt.encode({
		id: id
	}, tokenSecret); // const tokenSecret = 'put-a-$Ecr3t-h3re';

	// Updating user
	for (let i in users) {
		if (users[i].id === id) {
			users[i].token = token; //Create a token and add to user and save
			break; //Stop this loop, we found it!
		}
	}

	cb(token);

};


app.post('/token',
	passport.authenticate('local', {
		session: false
	}), // First, authenticates with username and password. If successful, creates a token
	(req, res) => {

		// If this function gets called, authentication was successful.
		// `req.user` contains the authenticated user, without his token yet.

		console.log("Login with password successful! Now creating token")

		createToken(req.user.id, (token) => {
			res.status(200).json({
				token: token
			});
		});
	});