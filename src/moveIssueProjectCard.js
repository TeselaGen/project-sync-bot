const getIssueProjectCard = require("./getIssueProjectCard");

module.exports = async function moveIssueProjectCard(
  octokit,
  issue,
  column,
  existingProjectCard
) {
  const projectCard =
    existingProjectCard || (await getIssueProjectCard(octokit, issue.html_url));

  const { name: columnName, id: newColumnId } = column;

  if (!projectCard) {
    console.info(
      `Creating card for ${issue.html_url} and moving to ${columnName}`
    );

    // make new project card for this issue
    await octokit.projects.createCard({
      column_id: newColumnId,
      content_id: issue.id,
      content_type: "Issue"
    });
    return {
      oldColumnId: null,
      newColumnId
    };
  } else {
    if (projectCard.column && projectCard.column.databaseId === newColumnId) {
      console.info(
        `Ignore move for ${issue.html_url} to ${columnName}, already there.`
      );
    } else {
      console.info(`Moving ${issue.html_url} to ${columnName}`);
      await octokit.projects.moveCard({
        card_id: projectCard.databaseId,
        position: "top",
        column_id: newColumnId
      });
      return {
        oldColumnId: projectCard.column && projectCard.column.databaseId,
        newColumnId
      };
    }
  }
};
