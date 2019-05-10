const { reposToAutomate } = require("../constants");
const { getIssueInfoForCard } = require("../utils");
const updateIssueLabels = require("../updateIssueLabels");

/*
  Handles updating issue labels when its project card is moved
  */
module.exports = async function onProjectCardMoved(context) {
  try {
    const octokit = context.github;
    if (context.isBot) return;

    const { project_card, changes } = context.payload;
    if (!changes) return;
    const { issueNumber, repo } = getIssueInfoForCard(project_card);
    if (!issueNumber || !reposToAutomate.includes(repo)) return;

    const oldColumnId = changes.column_id.from;
    const newColumnId = project_card.column_id;

    await updateIssueLabels(octokit, repo, issueNumber, {
      oldColumnId,
      newColumnId
    });
  } catch (error) {
    console.error("error:", error);
  }
};
