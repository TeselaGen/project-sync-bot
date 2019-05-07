// this query will find the project card for this issue if it exists (also hopefully there is only one)
module.exports = async function getIssueProjectCard(octokit, issueUrl) {
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
  return res.resource.projectCards.nodes[0];
};
