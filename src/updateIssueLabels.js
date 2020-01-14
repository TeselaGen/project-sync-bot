const getProjectColumns = require("./getProjectColumns");
const columnNameToLabel = require("./columnNameToLabel");
const { owner, columns } = require("./constants");

module.exports = async function updateIssueLabels({
  octokit,
  repo,
  issueNumber,
  oldColumnId,
  newColumnId
}) {
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
        number: issueNumber,
        labels: [newLabel]
      })
    );
  }

  // if we are moving into deployed column then close the issue
  if (projectColumns[newColumnId] === columns.deployed) {
    promises.push(
      octokit.issues.update({
        owner,
        repo,
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
};
