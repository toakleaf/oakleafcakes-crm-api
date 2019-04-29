# oakleafcakes-crm-api

A Customer Relationship and Order Management API for Oakleaf Cakes Bake Shop. Associated Web Interface @ (https://github.com/toakleaf/oakleafcakes-crm-ui)

## Project setup via docker-compose
1. Clone the repo
2. Set environment variables by either creating a `.private` directory with the files `node.env` and `postgres.env` (or rename/update `TEMPLATE.private` directory), or go into the `docker-comopse.yml` file and uncomment the environment variables settings which will import the local environment variables you set over comand line. All the commented out env variables listed in the `docker-compose.yml` file need to be included either way (via the env files or directly) to get it rolling.
3. Change the default settings in `config.js` to your liking.
4. In you command line: `$ cd` into root of the directory.
5. `$ docker-compose up --build -d`
6. `$ docker-compose exec node_api bash` -this takes you inside the node_api container
7. `$ npm run migrate` -this creates the db schema and seeds it. See script in the `package.json` for details.
8. Do fun things? Fire up the server with `$ nodemon` and start throwing trafic at `localhost:3000`. Alternatively you can make sure everything went swimmingly with `$ npm test`.
9. Shut it down: `$ docker-compose down`

## Using the API
### POST /account/login
Takes JSON payload:
```
{
	"email": "test@test.com",
	"password": "1234567891011"
}
```
Note: Default login credentials are located in /config.js file. Update email and password as you need for your own testing.

