/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */
const { invert } = require("lodash");
const { getIssueInfoForCard } = require("./utils");
const getProjectColumns = require("./getProjectColumns");
const columnNameToLabel = require("./columnNameToLabel");
const labelToColumnName = invert(columnNameToLabel);

const reposToAutomate = ["test-project-issues-bot"];

const owner = "TeselaGen";

module.exports = app => {
  // Your code here
  app.log("Yay, the app was loaded!");

  app.on("issues.opened", async context => {
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
      // if there is a column label the issues.labeled hook will handle the placement
      if (!backlogId || columnLabel) return;

      await octokit.projects.createCard({
        column_id: backlogId,
        content_id: issue.id,
        content_type: "Issue"
      });
    } catch (error) {
      console.error("error:", error);
    }
  });

  app.on("issues.labeled", async context => {
    try {
      // console.log("context.event:", context.event);
      // console.log("context.payload:", context.payload);
      const { issue, label } = context.payload;
      const octokit = context.github;
      const columnName = labelToColumnName[label.name];

      const issueUrl = context.payload.issue.html_url;
      // if it doesn't correspond to a column ignore the action
      if (!columnName) {
        return;
      }
      const { repo } = context.issue();
      if (!repo || !reposToAutomate.includes(repo)) return;
      const columns = await getProjectColumns(octokit, repo);
      const newColumnId = columns[columnName];

      const res = await octokit.query(
        `
        query getCardAndColumnAutomationCards($url: URI!) {
          resource(url: $url) {
            ... on Issue {
              databaseId
              projectCards(first: 10) {
                nodes {
                  databaseId
                  url
                  column {
                    databaseId
                    name
                  }
                }
              }
            }
          }
        }
        `,
        {
          url: issueUrl
        }
      );
      const projectCard = res.resource.projectCards.nodes[0];
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
  });

  app.on("project_card.moved", async context => {
    try {
      const octokit = context.github;

      const { project_card, changes } = context.payload;
      if (!changes) return;
      const { issueNumber, repo } = getIssueInfoForCard(project_card);
      if (!issueNumber || !reposToAutomate.includes(repo)) return;

      const oldColumnId = changes.column_id.from;
      const newColumnId = project_card.column_id;

      const projectColumns = await getProjectColumns(octokit, repo);
      const oldLabel = columnNameToLabel[projectColumns[oldColumnId]];
      const newLabel = columnNameToLabel[projectColumns[newColumnId]];
      if (oldLabel) {
        try {
          await octokit.issues.removeLabel({
            owner,
            repo,
            issue_number: issueNumber,
            number: issueNumber,
            name: oldLabel
          });
        } catch (error) {
          console.error("error:", error);
        }
      }
      if (newLabel) {
        try {
          await octokit.issues.addLabels({
            owner,
            repo,
            issue_number: issueNumber,
            number: issueNumber,
            labels: [newLabel]
          });
        } catch (error) {
          console.error("error:", error);
        }
      }
    } catch (error) {
      console.error("error:", error);
    }
  });

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
};
