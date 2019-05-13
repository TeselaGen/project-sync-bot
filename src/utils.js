function getIssueInfoForCard(projectCard) {
  const issueNumber =
    projectCard.content_url.includes("/issues") &&
    projectCard.content_url.split("/").pop();
  let repoMatch = projectCard.content_url.match(`repos/.*/(.*)/issues`);
  if (repoMatch) {
    repoMatch = repoMatch[1];
  }
  return {
    issueNumber,
    issueUrl: projectCard.content_url,
    repo: repoMatch
  };
}

module.exports = {
  getIssueInfoForCard
};
