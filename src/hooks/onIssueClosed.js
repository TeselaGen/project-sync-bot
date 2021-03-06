const { reposToAutomate, columns } = require("../constants");
const getProjectColumns = require("../getProjectColumns");
const getIssueProjectCard = require("../getIssueProjectCard");

/*
Handles moving issues to deployed when they are closed
*/
module.exports = async function onIssueClosed(context) {
  try {
    const octokit = context.github;
    const { repo } = context.issue();
    const { issue, pull_request } = context.payload;

    // event gets triggered for pull request closed as well
    if (pull_request) return;
    if (!repo || !reposToAutomate.includes(repo)) return;

    const projectColumns = await getProjectColumns(octokit, repo);
    const deployedId = projectColumns[columns.deployed];
    // if there is a column specific label the issues.labeled hook will handle the placement
    if (!deployedId) return;

    const projectCard = await getIssueProjectCard(octokit, issue.html_url);
    if (!projectCard) return;
    console.info("Moving closed issue to deployed");

    await octokit.projects.moveCard({
      card_id: projectCard.databaseId,
      position: "top",
      column_id: deployedId
    });
  } catch (error) {
    console.error("error:", error);
  }
};
