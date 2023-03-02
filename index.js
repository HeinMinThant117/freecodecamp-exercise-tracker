const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(bodyParser.urlencoded({ extended: false }));

const userSchema = new mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date: String,
  logs: Array,
});

const User = mongoose.model("User", userSchema);

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", async (req, res) => {
  const username = req.body.username;

  const user = new User();
  user.username = username;

  const newUser = await user.save();

  res.json({ _id: newUser._id, username: newUser.username });
});

app.get("/api/users", async (req, res) => {
  const users = await User.find({});

  const formattedUsers = users.map((user) => {
    return { _id: user._id, username: user.username };
  });

  res.json(formattedUsers);
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  const user = await User.findById(req.params._id);
  let logData = {};

  logData.description = req.body.description;
  logData.duration = Number(req.body.duration);
  if (req.body.date) {
    logData.date = new Date(req.body.date).toDateString();
  } else {
    logData.date = new Date().toDateString();
  }

  if (!user.logs) {
    user.logs = [];
  }
  user.logs.push(logData);

  const newUser = await user.save();

  res.json({
    _id: user._id,
    username: user.username,
    ...logData,
  });
});

app.get("/api/users/:_id/logs", async (req, res) => {
  const user = await User.findById(req.params._id);

  let from = req.query.from;
  let to = req.query.to;
  let limit = req.query.limit;

  if (from && to) {
    from = Date.parse(from);
    to = Date.parse(to);
    user.logs = user.logs.filter(
      (log) => Date.parse(log.date) >= from && Date.parse(log.date) <= to
    );
  }

  if (limit) {
    let newLog = [];
    for (let i = 0; i < limit; i++) {
      newLog.push(user.logs[i]);
    }
    user.logs = newLog;
  }

  res.json({
    _id: user._id,
    username: user.username,
    count: user.logs.length,
    log: user.logs,
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
