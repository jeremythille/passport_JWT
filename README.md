This is a working example of an authentication using PassportJS and Json Web Tokens.

This is used in the NodeJS training I give at Nomades in Geneva (2017-03)


# Launching the project

- You need to install and run MongoDB. Create a `passport_local_jwt_mongoose` database and a `users` collection. Inside the `users` collection, create a user : `{"username" : "jer" , "password" : "toto"}`.

- In a terminal : run `nodemon` to launch the NodeJS server. Then open Chrome on `localhost:8000`.
