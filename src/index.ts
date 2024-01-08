import { Hono } from "hono";
import { cache } from "hono/cache";
import { AwsClient } from "aws4fetch";

const app = new Hono<{
  Bindings: {
    ACCESS_KEY_ID: string;
    ACCESS_KEY_SECRET: string;
  };
}>();

const PETABOX_URL = "https://s3.petabox.io/pawdew";

const initAwsClient = (accessKey: string, secretKey: string) => {
  return new AwsClient({
    region: "us-east-1",
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
    service: "s3",
  });
};

app.get(
  "*",
  cache({
    cacheName: "pawdew-proxy",
    cacheControl: "max-age=86400",
  })
);

app.get("/", (c) => {
  return c.json({
    message:
      "this is pawdew download proxy, please go back to https://pawdew.com",
  });
});

app.get("*", async (c) => {
  const awsClient = initAwsClient(c.env.ACCESS_KEY_ID, c.env.ACCESS_KEY_SECRET);
  console.log(`${PETABOX_URL}${c.req.path}`);
  const item = await awsClient.fetch(`${PETABOX_URL}${c.req.path}`);

  c.header("Content-Type", item.headers.get("Content-Type") || "text/html");
  c.header("Content-Length", item.headers.get("Content-Length") || "0");

  c.status(item.status);

  return c.body(item.body);
});

export default app;
