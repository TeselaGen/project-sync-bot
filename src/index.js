/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */
const onProjectCardMoved = require("./hooks/onProjectCardMoved");
const onIssueOpened = require("./hooks/onIssueOpened");
const onIssueClosed = require("./hooks/onIssueClosed");
const onIssueLabeled = require("./hooks/onIssueLabeled");

module.exports = app => {
  // Your code here
  app.log("Yay, the app was loaded!");

  // Handles placing the issues into the backlog of the project when they are opened.
  app.on("issues.opened", onIssueOpened);

  // Handles moving issues to deployed when they are closed
  app.on("issues.closed", onIssueClosed);

  // Handles moving the issue's project card based on its labels
  app.on("issues.labeled", onIssueLabeled);

  // Handles updating issue labels when its project card is moved
  app.on("project_card.moved", onProjectCardMoved);

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
};
