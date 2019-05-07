const { reposToAutomate } = require("../constants");
const labelToColumnName = require("../labelToColumnName");
const getProjectColumns = require("../getProjectColumns");
const getIssueProjectCard = require("../getIssueProjectCard");

/*
  Handles moving the issues project card based on its labels
  */
module.exports = async function onIssueLabeled(context) {
  try {
    // console.log("context.event:", context.event);
    // console.log("context.payload:", context.payload);
    const { issue, label } = context.payload;
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

    const projectCard = await getIssueProjectCard(octokit, issue.html_url);
    if (!projectCard) {
      // make new project card for this issue
      await octokit.projects.createCard({
        column_id: newColumnId,
        content_id: issue.id,
        content_type: "Issue"
      });
    } else {
      await octokit.projects.moveCard({
        card_id: projectCard.databaseId,
        position: "top",
        column_id: newColumnId
      });
    }
  } catch (error) {
    console.error("error:", error);
  }
};
