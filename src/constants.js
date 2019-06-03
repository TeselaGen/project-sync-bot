const { trim } = require("lodash");
const reposToAutomate = process.env.REPOS_TO_AUTOMATE
  ? process.env.REPOS_TO_AUTOMATE.split(",").map(trim)
  : ["test-project-issues-bot"];

module.exports = {
  owner: "TeselaGen",
  reposToAutomate,
  labels: {
    mergedDev: "Status: 4-Merged/Pushed to Dev"
  },
  columns: {
    backlog: "Backlog"
  }
};
