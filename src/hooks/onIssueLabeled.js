const { reposToAutomate } = require("../constants");
const labelToColumnName = require("../labelToColumnName");
const getProjectColumns = require("../getProjectColumns");
const moveIssueProjectCard = require("../moveIssueProjectCard");

/*
  Handles moving the issues project card based on its labels
  */
module.exports = async function onIssueLabeled(context) {
  try {
    // console.log("context.event:", context.event);
    // console.log("context.payload:", context.payload);
    const { issue, label } = context.payload;
    if (context.isBot) return;

    const octokit = context.github;
    const columnName = labelToColumnName[label.name];
    // if it doesn't correspond to a column ignore the action
    if (!columnName) {
      return;
    }
    const { repo } = context.issue();
    if (!repo || !reposToAutomate.includes(repo)) return;
    const columns = await getProjectColumns(octokit, repo);
    const newColumnId = columns[columnName];

    await moveIssueProjectCard(octokit, issue, {
      id: newColumnId,
      name: columnName
    });
  } catch (error) {
    console.error("error:", error);
  }
};
