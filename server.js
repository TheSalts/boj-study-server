const express = require("express");
const axios = require("axios");
const cors = require("cors");
const fs = require("fs");
const baseURL = "https://solved.ac/api/v3";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get("/api/users", async (req, res) => {
  let userJson = await axios.get(
    "https://raw.githubusercontent.com/TheSalts/boj-study-server/refs/heads/main/userinfo.json"
  );
  let users = [];
  for (let username of userJson) {
    let options = {
      method: "GET",
      url: baseURL + "/user/show",
      params: { handle: username },
      headers: { "x-solvedac-language": "ko", Accept: "application/json" },
    };
    try {
      const { data } = await axios.request(options);
      users.push(data);
    } catch (error) {
      console.error(error);
    }
  }
  res.json(users);
});

app.get("/api/users/solved", async (req, res) => {
  let problems = { solved: [], unsolved: [] };
  let username = req.query.username;
  let studyProblems = await axios.get(
    "https://raw.githubusercontent.com/TheSalts/boj-study-server/refs/heads/main/problems.json"
  );
  let i = 1;
  while (true) {
    let options = {
      method: "GET",
      url: baseURL + "/search/problem",
      params: {
        query: "solved_by:" + username,
        direction: "desc",
        page: i,
        sort: "level",
      },
      headers: { "x-solvedac-language": "ko", Accept: "application/json" },
    };
    i++;
    try {
      const { data } = await axios.request(options);
      if (data.items.length === 0) break;
      data.items.forEach((item) => {
        if (studyProblems.includes(item.problemId)) {
          problems.solved.push(item);
        }
      });
    } catch (error) {
      console.error(error);
    }
  }
  let temp = [];
  studyProblems.forEach((problemId) => {
    if (
      !problems.solved.some(
        (solvedProblem) => solvedProblem.problemId === problemId
      )
    ) {
      temp.push(problemId);
    }
  });
  if (temp.length === 0) {
    problems.unsolved = [];
    res.json(problems);
    return;
  }
  let options = {
    method: "GET",
    url: baseURL + "/problem/lookup",
    params: {
      problemIds: temp.join(","),
    },
    headers: { "x-solvedac-language": "ko", Accept: "application/json" },
  };
  i++;
  try {
    const { data } = await axios.request(options);
    problems.unsolved = data;
  } catch (error) {
    console.error(error);
  }
  res.json(problems);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
