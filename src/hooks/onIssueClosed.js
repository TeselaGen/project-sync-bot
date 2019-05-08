const { reposToAutomate } = require("../constants");
const getProjectColumns = require("../getProjectColumns");
const getIssueProjectCard = require("../getIssueProjectCard");

/*
Handles moving issues to deployed when they are closed
*/
module.exports = async function onIssueClosed(context) {
  try {
    const octokit = context.github;
    const { repo } = context.issue();
    const { issue } = context.payload;
    if (!repo || !reposToAutomate.includes(repo)) return;

    const columns = await getProjectColumns(octokit, repo);
    const deployedId = columns["Deployed"];
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
