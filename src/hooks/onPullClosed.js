const { get } = require("lodash");
const { reposToAutomate } = require("../constants");
const labelToColumnName = require("../labelToColumnName");
const getProjectColumns = require("../getProjectColumns");
const moveIssueProjectCard = require("../moveIssueProjectCard");
const getIssuesWithCardByNumber = require("../getIssuesWithCardByNumber");
const { labels } = require("../constants");
const updateIssueLabels = require("../updateIssueLabels");

/*
  Handles moving issues to merged when a connecting pull request is closed
  */
module.exports = async function onPullClosed(context) {
  try {
    const octokit = context.github;
    const { pull_request } = context.payload;
    const { repo } = context.repo();
    if (!repo || !reposToAutomate.includes(repo)) return;
    // if it was not merged ignore
    if (!pull_request.merged) return;
    const connectedIssues = (pull_request.body || "").match(/connects #(\d*)/g);
    const baseBranch = pull_request.base.ref;

    if (baseBranch === "master" && connectedIssues) {
      const issueNumbers = connectedIssues.map(issueString =>
        issueString.replace("connects #", "")
      );

      const issues = await getIssuesWithCardByNumber(
        octokit,
        issueNumbers,
        context.issue()
      );
      const projectColumns = await getProjectColumns(octokit, repo);
      const newColumnName = labelToColumnName[labels.mergedDev];
      await Promise.all(
        issues.map(async issue => {
          // move issue project card, will not be labeled because a bot is moving it
          const issueInfo = {
            id: issue.databaseId,
            html_url: issue.url
          };
          const columnInfo = {
            id: projectColumns[newColumnName],
            name: newColumnName
          };
          const existingProjectCard = get(issue, "projectCards.nodes[0]");
          const res = await moveIssueProjectCard(
            octokit,
            issueInfo,
            columnInfo,
            existingProjectCard
          );

          // handle updating issue labels
          if (res) {
            const { oldColumnId, newColumnId } = res;
            await updateIssueLabels({
              octokit,
              repo,
              issueNumber: issue.number,
              oldColumnId,
              newColumnId
            });
          }
        })
      );
    }
  } catch (error) {
    console.error("error:", error);
  }
};
