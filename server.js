const { from } = require("rxjs");
const { mergeMap, toArray } = require("rxjs/operators");

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const serviceAccount = require("./fire-demo-a766b-firebase-adminsdk-gs1tt-fc21e4f4a3.json");

const app = express();
const users = [];

app.use(cors());
app.use(bodyParser.json());

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

/**
 * token:
 * c3l05ZervYFF6O-cQoXWbm:APA91bF8QDvmPAedLKeN9_P7dVy-BUeGJ6mBeJXbr-VnroWgz2wAAL9MNO_tQLh9oAImHB5BHYCx0njP-pZy-7ww2ikhJoR52onHRyXvK_nP9kk_Jszu1DTw_bEsSQ5JwzweVnblheEo
 */
app.post("/api/register", (req, res) => {
  if (!req.body.token) {
    return res.status(200).json({
      result: "fail",
      detail: "Missing required fields: token",
      timestamp: Date.now(),
    });
  }
  if (!req.body.group) {
    return res.status(200).json({
      result: "fail",
      detail: "Missing required fields: group",
      timestamp: Date.now(),
    });
  }

  users.push({
    id: users.length + 1,
    token: req.body.token,
    group: req.body.group,
  });

  res.status(200).json({
    result: "success",
    detail: "",
    timestamp: Date.now(),
  });
});

/**
 * content:{
 *  notification:{
 *    body: "dddd",
 *    data: {
 *      url: "https://www.google.com"
 *    },
 *    title: "標題ABC"
 *  }
 * }
 */
app.post("/api/push", (req, res) => {
  if (!req.body.group) {
    return res.status(200).json({
      result: "fail",
      detail: "Missing required fields: group",
      timestamp: Date.now(),
    });
  }
  if (!req.body.content) {
    return res.status(200).json({
      result: "fail",
      detail: "Missing required fields: content",
      timestamp: Date.now(),
    });
  }

  const receiveMessages = users
    .filter((user) => {
      return user.group === req.body.group;
    })
    .map((user) => {
      const m = {
        token: user.token,
        webpush: {
          headers: {
            "Content-Encoding": "aesgcm",
          },
          ...req.body.content,
        },
      };
      return m;
    });

  from(receiveMessages)
    .pipe(
      mergeMap((receiveMessage) =>
        admin
          .messaging()
          .send(receiveMessage)
          .then((response) => {
            return "success";
          })
          .catch((error) => {
            return `${receiveMessage.id}`;
          })
      ),
      toArray()
    )
    .subscribe((results) => {
      const allSuccess = results.every((result) => result === "success");
      if (allSuccess) {
        res
          .status(200)
          .json({ result: "success", detail: "", timestamp: Date.now() });
      } else {
        const failed = results.find((id) => id !== "success");
        res.status(200).json({
          result: "fail",
          detail: `id=${failed}`,
          timestamp: Date.now(),
        });
      }
    });
});

app.get("/api/version", (_, res) => {
  res.status(200).json({
    version: "1.0.0",
    timestamp: Date.now(),
  });
});

app.set("port", 12345);

const server = app.listen(app.get("port"), () => {
  console.log(`Express running → PORT ${server.address().port}`);
});
