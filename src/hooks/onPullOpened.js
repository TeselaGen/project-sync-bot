const { get } = require("lodash");
const { reposToAutomate } = require("../constants");
const labelToColumnName = require("../labelToColumnName");
const getProjectColumns = require("../getProjectColumns");
const moveIssueProjectCard = require("../moveIssueProjectCard");
const getIssuesWithCardByNumber = require("../getIssuesWithCardByNumber");
const { labels, inProgressStatusNum } = require("../constants");
const updateIssueLabels = require("../updateIssueLabels");
const columnNameToLabel = require("../columnNameToLabel");

/*
  Handles moving issues to development when a connecting pull request is opened
  */
module.exports = async function onPullOpened(context) {
  try {
    const octokit = context.github;
    const { pull_request } = context.payload;
    const { repo } = context.repo();
    if (!repo || !reposToAutomate.includes(repo)) return;
    const connectedIssues = (pull_request.body || "").match(
      /connects #(\d*)/gi
    );
    const baseBranch = pull_request.base.ref;

    if (baseBranch === "master" && connectedIssues) {
      const issueNumbers = connectedIssues.map(issueString =>
        issueString.toLowerCase().replace("connects #", "")
      );

      const issues = await getIssuesWithCardByNumber(
        octokit,
        issueNumbers,
        context.issue()
      );
      const projectColumns = await getProjectColumns(octokit, repo);
      const newColumnName = labelToColumnName[labels.inProgress];
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

          if (existingProjectCard) {
            const oldColumnName = existingProjectCard.column.name;
            const label = columnNameToLabel[oldColumnName];
            let labelStatusNumber = (label || "").match(/WB: (\d*\.?\d*)/);
            if (labelStatusNumber) {
              labelStatusNumber = parseFloat(labelStatusNumber[1]);
            }

            // if we are already passed merged in progress then don't move this card
            // for example, opening a pr for something already in merged
            if (labelStatusNumber >= inProgressStatusNum) return;
          }

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
