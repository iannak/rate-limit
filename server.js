const express = require("express");
const app = express();

const { createClient } = require("redis");
const client = createClient();

const rateLimit =
  (resource, limit = 5) =>
  async (req, res, next) => {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    //identificar o recurso
    const key = `rate-limit:${resource}:${ip}`;
    const requestCount = Number((await client.get(key)) || 0) + 1;
    await client.set(key, requestCount, "EX", 30);
    if (requestCount > limit) {
      return res.send({ error: "rate-limit exceeded" });
    }
    next();
  };

app.use(rateLimit("app", 8));

app.get("/", rateLimit("home"), async (req, res) => {
  res.send({
    message: "Hello World",
  });
});

app.get("/users", rateLimit("users"), async (req, res) => {
  const users = [
    {
      id: 1,
      name: "John Doe",
    },
    {
      id: 2,
      name: "Jane Doe",
    },
  ];
  res.send({
    users,
  });
});

const startaup = async () => {
  await client.connect();
  app.listen(3000, () => {
    console.log("Server is running on port 3000");
  });
};

startaup();
