const { nanoid } = require("nanoid");

let restaurants = [
  {
    id: "4Oj9hUC-EwrYdn9uOYeui",
    name: "Puerto Viejo",
    cuisine: "dominican",
    hasTakeout: true,
  },
  {
    id: "8NBUuV1hY1mUEomWxnws1",
    name: "Sadas",
    cuisine: "japanese",
    hasTakeout: true,
  },
];

module.exports = {
  // function names must match `operationId` from schema to work with fastify-openapi-glue
  getRestaurants: async function (_req, res) {
    res.send(restaurants);
  },
  getRestaurant: async function (req, res) {
    // get id from path parameters
    const { id } = req.params;
    // Get restaurant from database
    const found = restaurants.find((r) => r.id === id);

    // Send restaurant in response if found, otherwise send 404
    if (found) {
      res.send(found);
    } else {
      res.code(404).send({ message: `Restaurant with id '${id}' not found` });
    }
  },
  addRestaurant: async function (req, res) {
    // get newRestaurant properties from request body
    const newRestaurant = req.body;
    // generate a unique random id and add it to newRestaurant
    newRestaurant.id = nanoid();

    // save new restaurant to db
    restaurants.push(newRestaurant);

    res.code(201).send(newRestaurant);
  },
  updateRestaurant: async function (req, res) {
    // get id from path parameters
    const { id } = req.params;

    // check that restuarant exists
    const foundIndex = restaurants.findIndex((r) => r.id === id);

    if (foundIndex) {
      // Update restaurant in database
      const prevData = restaurants[foundIndex];
      restaurants[foundIndex] = { ...prevData, ...req.body };
      // send empty response OK
      res.code(204).send();
    } else {
      res.code(404).send({ message: `Restaurant with id '${id}' not found` });
    }
  },
  deleteRestaurant: async function (req, res) {
    // get id from path parameters
    const { id } = req.params;

    // check that restuarant exists
    const foundIndex = restaurants.findIndex((r) => r.id === id);

    if (foundIndex) {
      // Delete restaurant from database
      restaurants = restaurants.splice(foundIndex, 1);
      // send empty response OK
      res.code(204).send();
    } else {
      res.code(404).send({ message: `Restaurant with id '${id}' not found` });
    }
  },
};
