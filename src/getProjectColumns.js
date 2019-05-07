/**
 * This function will return the project columns object with
 * keys of column name and values of columnId. If the app has
 * not fetched this data then it will query for it.
 */

const helper = require("./helper");

module.exports = async function getProjectColumns(octokit, repo) {
  if (!helper[repo]) {
    const projects = await octokit.projects.listForOrg({
      org: "teselagen"
    });
    const projectForRepo = projects.data.find(
      p => p.name.toLowerCase() === `teselagen/${repo}`
    );
    if (projectForRepo) {
      const columns = await octokit.projects.listColumns({
        project_id: projectForRepo.id
      });
      helper[repo] = {
        projectId: projectForRepo,
        columns: columns.data.reduce((acc, column) => {
          acc[column.name] = column.id;
          acc[column.id] = column.name
          return acc;
        }, {})
      };
    }
  }
  if (helper[repo]) {
    return helper[repo].columns;
  } else {
    throw new Error(`No columns found for repo: ${repo}`);
  }
};
