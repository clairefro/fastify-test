## Getting started

`npm install` - get all package dependencies

### Development

`npm run dev` - starts dev server that watches for changes in js code and restarts automatically

\*Note: need to restart server manually if you change `schema.yaml`

### Deployment

Ensure this command runs on deployment:

`npm start`

## rough order

POSTMAN

1. copy schema
1. create public workspace in postman
1. create new api in postman
1. paste schema into api definition
1. generate test collection
1. show test collection

CODE

### Chapter 1 - Building a CRUD API

1. intro to node/npm/fastify
1. start new project `mkdir my-api` `cd my-api` `npm init -y`
1. Install fastify `npm install fastify`. this will add a `node_modules` folder for our dependencies. You can view your dependencies in `package.json`
   Optional:
1. Start git tracking `git init`
1. add `.gitgnore` file to ignore things we don't want to push to GitHub: `touch .gitignore`
1. add `node_modules` on first line inside `.gitignore` file
1. fastify hello world:

```js
// https://www.fastify.io/

// Require the framework and instantiate it
const fastify = require("fastify")({ logger: true });

// Declare a route
fastify.get("/", async (request, reply) => {
  return { hello: "world" };
});

// Run the server!
const start = async () => {
  try {
    await fastify.listen(3000);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
```

1. `mkdir src` `touch src/server.js`
1. run `node src/server.js`
1. add `start` script in `package.json`: `"start": "node src/server.js" `
1. npm start
1. hit `/` in Postman
1. change hello world text
1. hit `/` in Postman again - doesn't change! bc you have to restart server
1. introduce `nodemon`
1. add `dev` script in package.json: `"dev": "nodemon src/server.js" `
1. `npm run dev`
1. show that saving changes restarts server, hit with Postman again
1. plan out the routes

```js
// GET /restaurants
// POST /restaurants
// GET /restaurant/:id
// PUT /restaurants/:id
// DELETE /restaurants/:id
```

1. start with `GET /restaurants`
1. there are many ways to make routes. we will go with shorthand: https://www.fastify.io/docs/latest/Reference/Routes/

`fastify.get(path, [options], handler)`

```js
// src/server.js

fastify.get("/restaurants", async (req, res) => {
  res.send([]);
});
```

1. try it in Postman. add `http://localhost:3000` as `baseUrl` in Postman
1. add temporary db

```js
// src/server.js

let restaurants = [
  {
    id: "abc",
    name: "Puerto Viejo",
    cuisine: "dominican",
    hasTakeout: true,
  },
  {
    id: "def",
    name: "Cataldo",
    cuisine: "italian",
    hasTakeout: false,
  },
];

fastify.get("/restaurants", async (req, res) => {
  res.send(restaurants);
});
```

1. try it in Postman

1. add `POST /restaurants`. We will use a library called `nanoid` to generate a random Universally Unique Identifier (UUID) for each new restaurant
1. `npm install nanoid`

```js
// src/server.js
const { nanoid } = require("nanoid");
// ...

// POST /restaurants
fastify.post("/restaurants", async (req, res) => {
  // get newRestaurant properties from request body
  const newRestaurant = req.body;

  // generate a UUID and add it to newRestaurant
  newRestaurant.id = nanoid();

  // save new restaurant to db
  restaurants.push(newRestaurant);

  res.code(201).send(newRestaurant);
});
```

1. add the rest of the routes

```js
// src/server.js

// GET /restaurants/:id
fastify.get("/restaurants/:id", async (req, res) => {
  // get id from path parameters
  const { id } = req.params;

  // Get restaurant from database
  const restaurant = restaurants.find((r) => r.id === id);

  // Send restaurant in response if found, otherwise send 404
  if (restaurant) {
    res.send(restaurant);
  } else {
    res.code(404).send({ message: `Restaurant with id '${id}' not found` });
  }
});

// PUT /restaurants/:id
fastify.put("/restaurants/:id", async (req, res) => {
  // get id from path parameters
  const { id } = req.params;

  // check that restaurant exists. If not found, `foundIndex` will equal -1
  const foundIndex = restaurants.findIndex((r) => r.id === id);

  if (foundIndex > -1) {
    // Update restaurant in database at foundIndex
    const prevData = restaurants[foundIndex];
    restaurants[foundIndex] = { ...prevData, ...req.body };
    // send empty response OK
    res.code(204).send();
  } else {
    res.code(404).send({ message: `Restaurant with id '${id}' not found` });
  }
});

// DELETE /restaurants/:id
fastify.delete("/restaurants/:id", async (req, res) => {
  // get id from path parameters
  const { id } = req.params;

  // check that restaurant exists. If not found, `foundIndex` will equal -1
  const foundIndex = restaurants.findIndex((r) => r.id === id);

  if (foundIndex > -1) {
    // Delete restaurant from database
    restaurants.splice(foundIndex, 1);
    // send empty response OK
    res.code(204).send();
  } else {
    res.code(404).send({ message: `Restaurant with id '${id}' not found` });
  }
});
```

1. try all these out in Postman along the way
1. Problem: What happens when you try to create a new restaurant with missing or wrong properties from Postman?

### Chapter 2 - Validating Requests

1. validating requests gives clients useful error information when they enter bad data. fastify lets you [validate each route independently with JSON schema validation](https://www.fastify.io/docs/latest/Reference/Validation-and-Serialization/#validation) to make sure the user enters the right types of data and the server gives the right type of response

But we already have an OpenAPI spec that defines what we expect!
we'll use a library called `fastify-open-api-glue` that will use our schema to validate all requests and responses. ([fastify-open-api-glue docs](https://www.npmjs.com/package/fastify-openapi-glue))

1. `npm install fastify-open-api-glue`

1. this library generates fastify routes for us based on services we name after each `operationId` in the OpenAPI schema.

We need to move our fastify routes into a service class

1. `touch src/service.js`

(See chapter 2 branch)

1. In `src/server.js` add this after the last `require()` to register `fastify-openapi-glue as a plugin on the fastify instance

```js
// src/server.js

// ...other require statements
const Service = require("./service.js");

const glueOptions = {
  specification: `${__dirname}/schema.yaml`,
  service: new Service(),
};

fastify.register(openapiGlue, glueOptions);
```

1. Now try sending a bad request like `POST /restaurants` with a Body of `{ foo: 'bar' }`. You should get a `400 Bad Request` error!

### Chapter 3 - Persisting data

Another problem - you may have noticed everytime our server restarts, we lose all the data in our "database". That's because our current "database" is just an array that lives in Node's memory. Also, this object isn't good at handling updates from multiple clients at once, so it isn't ideal for scaling your API.

We need to persist our data in a database.

There are many database solutions out there, like PostgreSQL, MySQL, Redis, etc. We will use MongoDB in our example. `mongoose` is a library that helps us work with MongoDB in Node.

Takeaways order:

1. Create API in workspace in Postman
1. Define schema in schema editor
