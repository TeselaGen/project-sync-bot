async function getIssueByNumber(octokit, issueNumber, filter) {
  try {
    const res = await octokit.query(
      `
      query getIssuesWithProjectCardQuery($issueNumber: Int!) {
        repository(owner: "${filter.owner}", name: "${filter.repo}") {
          issue (number: $issueNumber) {
            databaseId
            url
            number
            projectCards(first: 1) {
              nodes {
                databaseId
                column {
                  name
                  databaseId
                }
              }
            }
          }
        }
      }
    `,
      {
        issueNumber: Number(issueNumber)
      }
    );
    return res.repository.issue;
  } catch (error) {
    console.error("error fawef:", error);
  }
}

module.exports = async function getIssuesByNumber(
  octokit,
  issueNumbers,
  filter
) {
  const issues = await Promise.all(
    issueNumbers.map(issue_number => {
      return getIssueByNumber(octokit, issue_number, filter);
    })
  );
  return issues.filter(issue => issue);
};
