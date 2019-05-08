const { reposToAutomate } = require("../constants");
const getProjectColumns = require("../getProjectColumns");
const labelToColumnName = require("../labelToColumnName");

/* 
  Handles placing the issues into the backlog of the project when they are opened.
  */
module.exports = async function onIssueOpened(context) {
  try {
    const octokit = context.github;
    const { repo } = context.issue();
    const { issue } = context.payload;
    if (!repo || !reposToAutomate.includes(repo)) return;

    const columns = await getProjectColumns(octokit, repo);
    const backlogId = columns["Backlog"];
    const columnLabel = issue.labels.find(
      label => labelToColumnName[label.name]
    );
    // if there is a column specific label the issues.labeled hook will handle the placement
    if (!backlogId || columnLabel) return;
    console.info("Moving new issue to backlog");
    await octokit.projects.createCard({
      column_id: backlogId,
      content_id: issue.id,
      content_type: "Issue"
    });
  } catch (error) {
    console.error("error:", error);
  }
};
