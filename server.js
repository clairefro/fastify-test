// Require the framework and instantiate it
const fastify = require("fastify")({ logger: true });
const openapiGlue = require("fastify-openapi-glue");
const service = require("./service.js");

const glueOptions = {
  specification: `${__dirname}/schema.yaml`,
  service,
};

fastify.register(openapiGlue, glueOptions);

// Declare a route
// fastify.get("/", async (req, res) => {
//   return { hello: "world" };
// });

// CREATE - add a restaurant
// fastify.post("/restaurants", async (req, res) => {
//   // get restuarant data from request body
//   // save to db
//   // TODO: return new restaurant
// });

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
