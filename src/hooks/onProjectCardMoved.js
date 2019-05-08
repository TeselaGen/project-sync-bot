const { owner, reposToAutomate } = require("../constants");
const { getIssueInfoForCard } = require("../utils");
const getProjectColumns = require("../getProjectColumns");
const columnNameToLabel = require("../columnNameToLabel");

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

    const projectColumns = await getProjectColumns(octokit, repo);
    const oldLabel = columnNameToLabel[projectColumns[oldColumnId]];
    const newLabel = columnNameToLabel[projectColumns[newColumnId]];
    const promises = [];

    // use promise catcher so that we can par
    if (oldLabel) {
      promises.push(
        octokit.issues.removeLabel({
          owner,
          repo,
          issue_number: issueNumber,
          number: issueNumber,
          name: oldLabel
        })
      );
    }

    if (newLabel) {
      promises.push(
        octokit.issues.addLabels({
          owner,
          repo,
          issue_number: issueNumber,
          number: issueNumber,
          labels: [newLabel]
        })
      );
    }

    // if we are moving into deployed column then close the issue
    if (projectColumns[newColumnId] === "Deployed") {
      promises.push(
        octokit.issues.update({
          owner,
          repo,
          issue_number: issueNumber,
          number: issueNumber,
          state: "closed"
        })
      );
    }

    // group promises to run in parallel but also catch so that one doesn't prevent the others
    await Promise.all(
      promises.map(async promise => {
        try {
          await promise;
        } catch (error) {
          console.error("error:", error);
        }
      })
    );
  } catch (error) {
    console.error("error:", error);
  }
};
