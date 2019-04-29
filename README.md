# A Customer Relationship and Order Management API for Oakleaf Cakes Bake Shop.

Associated Web Interface @ (https://github.com/toakleaf/oakleafcakes-crm-ui)

## Project setup via docker-compose

1. Clone the repo
2. Set environment variables by either creating a `.private` directory with the files `node.env` and `postgres.env` (or rename/update `TEMPLATE.private` directory), or go into the `docker-comopse.yml` file and uncomment the environment variables settings which will import the local environment variables you set over command line. All the commented out env variables listed in the `docker-compose.yml` file need to be included either way (via the env files or directly) to get it rolling.
3. Change the default settings in `config.js` to your liking.
4. In you command line: `$ cd` into root of the directory.
5. `$ docker-compose up --build -d`
6. `$ docker-compose exec node_api bash` -this takes you inside the node_api container
7. `$ npm run migrate` -this creates the db schema and seeds it. See script in the `package.json` for details.
8. Do fun things? Fire up the server with `$ nodemon` and start throwing traffic at `localhost:3000`. Alternatively you can make sure everything went swimmingly with `$ npm test`.
9. Shut it down: `$ docker-compose down`

## About the API

The API is still under development, however, current feature set includes:

### Accounts

There are currently 3 basic roles an account can assume (with the expendability to add more).

1. ADMIN - Have full access to all API features
2. EMPLOYEE - Have access to features pertaining their personal employee account and all customer accounts
3. CUSTOMER - Have access to only features pertaining to their personal account.

The account system is more complex then most login credential systems. One of the design criteria was to minimize duplication, and maximize consistency of all customer data across the system, despite the fact that customer account records can be created in many different ways (by employees when customer calls or visits, and by customers when they place an order through the website). Obviously a customer placing an order over the phone is not going to be able to supply login details to create an account, but if a customer wishes to place an order via the website we wanted to ensure that they could claim their account and retrieve their order history. This allows us to keep a consistent record for each of our customers, independent of how orders are placed.

Beyond the account reclamation features built into the system, it has all the security features you'd like to see in a user authentication system. We utilize bcrypt hashing, have password reset emailing for forgotten passwords, and JWT tokens for authentication. While we considered implementing a redis system for token authentication that would allow us to immediately block user access before token expiry, we opted to instead create a /system/ route that can manually reset the JWT secret key system-wide. Because we are such a small organization, we thought that the tradeoff of complexity and speed was worth it considering how rare it would be to need to lock out an employee or admin account, and how little actual disruption it would cause.

### System

## Using the API

### POST /account/login

Takes JSON payload:

```
{
	"email": "test@test.com",
	"password": "1234567891011"
}
```

Returns HTTP Header: x-auth-token, which is a JWT to pass as "Authorization : Bearer" header on all protected routes.
Note: Default login credentials are located in /config.js file. Update email and password as you need for your own testing.

### GET /account/

Requires user be logged in.
Returns JSON payload:

```
{
	"email": "test@test.com",
	"password": "1234567891011"
}
```
