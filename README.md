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

The API is still under development, as a replacement to current system in use, a php/mysql/jquery monolith I made, and that's been running the day-to-day customer management operations of our bakery for the last 7 years.

### Accounts

There are currently 3 basic roles an account can assume (with the expendability to add more).

1. ADMIN - Have full access to all API features
2. EMPLOYEE - Have access to features pertaining their personal employee account and all customer accounts
3. CUSTOMER - Have access to only features pertaining to their personal account.

The account system is more complex then most login credential systems. One of the design criteria was to minimize duplication, and maximize consistency of all customer data across the system, despite the fact that customer account records can be created in many different ways (by employees when customer calls or visits, and by customers when they place an order through the website). Obviously a customer placing an order over the phone is not going to be able to supply login details to create an account, but if a customer wishes to place an order via the website we wanted to ensure that they could claim their account and retrieve their order history. This allows us to keep a consistent record for each of our customers, independent of how orders are placed.

Beyond the account reclamation features built into the system, it has all the security features you'd like to see in a user authentication system. We utilize bcrypt hashing, have password reset emailing for forgotten passwords, and JWT tokens for authentication. While we considered implementing a redis system for token authentication that would allow us to immediately block user access before token expiry, we opted to instead create a /system/ route that can manually reset the JWT secret key system-wide. Because we are such a small organization, we thought that the tradeoff of complexity and speed was worth it considering how rare it would be to need to lock out an employee or admin account, and how little actual disruption it would cause.

### System

Allows the alteration to system-wide api settings. Currently includes ability to reset JWT secret key and expiration.

### Order

Still under development. Will allow various types of bakery orders, and will allow orders to be broken down into constituent tasks to be tracked through their execution by employees to allow for detailed costing of future order creations.

### Payment

Still under development. Will allow for acceptance and processing of payments. Will likely be integrated into current square payment processing system utilized by bakery.

### Stats

Still under development. Will periodically collect and organize data at off-peak-usage times so that display of statistics needn't force massive database queries every time a statistical display is called.

## Using the API

### POST /account/login

Takes JSON payload:

```
{
	"email": "required",
	"password": "required"
}
```

Returns HTTP Header: x-auth-token, which is a JWT to pass as "Authorization : Bearer" header on all protected routes.
Note: Default login credentials are located in /config.js file. Update email and password as you need for your own testing.

### GET /account/

Requires user be logged in.

Returns JSON payload of logged in account's information:

```
[
    {
        "id": "1",
        "first_name": "Test",
        "last_name": "Testerson",
        "company_name": "Fake Corp",
        "email": "test@test.com",
        "email_is_primary": true,
        "role": "ADMIN",
        "phone": "(617) 444-4444",
        "phone_is_primary": true,
        "phone_type": "mobile",
        "phone_country": "US",
        "created_at": "2019-04-29T16:24:30.453Z",
        "updated_at": "2019-04-29T16:24:30.453Z"
    }
]
```

### POST /account/register

For registering new ADMIN, EMPLOYEE, or CUSTOMER accounts, with or without login credentials. Requires user be logged in as ADMIN or EMPLOYEE. (General public will use /account/signup route to create their own CUSTOMER accounts w/ login credentials)

Takes JSON payload:

```
{
	"email": "string-required",
	"password": "string-optional",
	"role": "string-required",
	"first_name": "string-optional",
	"last_name": "string-optional",
	"company_name": "string-optional",
	"phone": "string-optional",
	"phone_type": "string-optional",
	"phone_country": "string-optional"
}
```

Returns JSON payload of created account's information (see GET /account/ output), and (if login credentials supplied) will send account verification email to user.

### POST /account/signup

General public will use this route to create their own CUSTOMER accounts w/ login credentials required, or to claim an already existing account, and create new login credentials for it, if the supplied email or phone number matches an existing CUSTOMER account lacking login credentials.

NOTE: If an account is being claimed, provided payload data will be stored in the account history as a normal UPDATE request with a flag indicating that request was never processed. No data will be overwritten until the point at which the account is verified by the user.

Takes JSON payload:

```
{
	"email": "string-required",
	"password": "string-required",
	"role": "string-required",
	"first_name": "string-optional",
	"last_name": "string-optional",
	"company_name": "string-optional",
	"phone": "string-optional",
	"phone_type": "string-optional",
	"phone_country": "string-optional"
}
```

Returns Status 200 if successful, and sends account verification email to user.

### POST /account/verify/:id/:token

Route is active after account login credentials are created. If this route is triggered as a result of an account being claimed, it will also push an update of the account's data (stored via the account history) if the payload data supplied when account was first claimed differs from that in the account.

Takes params id (int) and token (string).

Returns 200 status and HTTP Header: x-auth-token, which is a JWT to pass as "Authorization : Bearer" header on all protected routes.

### POST /account/forgot

Takes JSON payload:

```
{
	"email": "string-required",
}
```

Returns Status 200 no matter what, and sends account password reset email to user if account exists.

Note: password will not be reset until user follows link in email to /account/reset route.

### DELETE /account/password

This route is used by ADMIN or EMPLOYEE accounts to manually overwrite an account's password to a randomly generated string. ADMIN can invoke on any account, EMPLOYEE can invoke on non ADMIN or EMPLOYEE accounts.

Takes JSON payload:

```
{
	"email": "string-required",
	"lock": "boolean-optional"
}
```

Returns Status 200 if successful. If lock boolean flag is true, then no password reset email will be sent. However, if lock boolean flag is null or false, then password email will be sent.

### POST /account/reset/:id/:token

Route is active for short time after POST /account/forgot or DELETE /account/password routes are triggered (and account hasn't been inactivated).

Takes params id (int) and token (string).

Returns 200 status and HTTP Header: x-auth-token, which is a JWT to pass as "Authorization : Bearer" header on all protected routes.

### GET /account/search

Requires user be logged in as either ADMIN or EMPLOYEE.

Takes a query string with any of the following queries (everything is optional):

```
	orderby= (id, email, first_name, last_name, company_name, created_at, updated_at, role)
	order= (asc, desc)
	count= (int)
	page= (int)
	role= (ADMIN, EMPLOYEE,  CUSTOMER)
	field= (id, email, first_name, last_name, company_name, phone)
	query= (string)
	exact= (boolean)
	active= (boolean)
	inactive= (boolean)
```

Note:

1. If exact is null or false, query will be 'ilike %query%'.
2. If active and inactive both true or both null, then will return all active and inactive records. If only one is true, then will retrieve just that.
3. Count is number of results to return per page
4. Page is the page number to return given a count. (requires count be present to work)
5. Similarly, query requires field to be present to return results.
6. Role can be expressed in query string multiple times to match multiple roles.

Returns JSON where accounts match query, of given account's account information (see GET /account route for example output).

### GET /account/history/:id

Requires user be logged in as either ADMIN or EMPLOYEE.

Takes an id param (int) and a JSON payload:

```
	"orderby": "string-matching 'account_id', 'author', 'action', 'created_at' ",
	"order": "string-matching 'account_id', 'asc', 'desc' ",
	"count": "int",
	"page": "int"
```

Returns JSON payload of all history regarding for a given account id (as submitted in the param):

```
[
    {
        "id": "1",
        "account_id": "2",
        "author": "1",
        "action": "CREATE",
        "transaction": {
            "first_name": "John",
            "last_name": "Doe",
            "company_name": "Evil Corp",
            "email": "test2@test.com",
            "role": "CUSTOMER",
            "phone": "(123) 456-7890",
            "phone_type": "mobile"
        },
        "created_at": "2019-04-29T18:35:21.552Z"
    }
]
```

### DELETE /account/:id

This route is accessible by ADMIN accounts only.

Takes an id param (int).

Returns status 200 and HTTP Header 'x-deleted-account' with the account id if completed successfully.

### POST /system/jwt/refresh

This route is used to refresh the JWT secret key for the entire system, thereby instantly invalidating all outstanding JWT tokens, and forcing all users to re-login to continue using site. This route is in effect as a last defense against rouge accounts so logouts can assured, even before token expiration. Decided to go this route rather than setting up Redis server to verify every single authentication, as company is small and use of this route should be rare enough to not necessitate the overhead of Redis.

Requires user be logged in as an ADMIN.

Takes no input payload.

Returns 200 status and HTTP Header: x-auth-token, which is a JWT to pass as "Authorization : Bearer" header on all protected routes.

### GET /system/jwt/expires

Requires user be logged in as an ADMIN.

Takes no input payload.

Returns JSON payload of how long JWT's are valid:

```

{ "expiration": "string-matching-pattern (int)('s', 'm', 'h', 'd', 'w')" }

```

### POST /system/jwt/expires

Requires user be logged in as an ADMIN.

Takes JSON payload of how long JWT's are valid:

```

{
	"quantity": "int-required",
	"unit": "string-required"
}

```

Note: Unit is can be any unit of time, such as: m, min, minutes, etc... However, it is recommended to stick with a single letter abbreviation for consistency: s, m, h, d, w.

Returns Status 200 if successful.
