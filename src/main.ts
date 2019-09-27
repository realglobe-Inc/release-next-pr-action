import * as core from '@actions/core'
import * as github from '@actions/github'

import PRAnalyzer from './pr-analyzer'

async function run() {
  try {
    // get inputs
    const token: string = core.getInput('github-token', { required: true })

    // check the event's kind
    const eventName: string = github.context.eventName
    if (eventName !== 'pull_request') {
      core.info(
        `Nothing to do since the event is "${eventName}", not "pull_request". Bye.`,
      )
      return
    }

    // check the pull_request event's kind
    const payload = github.context.payload
    if (payload.action !== 'closed') {
      core.info(
        `Nothing to do since the pull request's action is "${payload.action}", not "closed". Bye.`,
      )
      return
    }

    // check whether the PR is merged
    const thePR = payload.pull_request
    if (thePR == null) {
      core.setFailed(
        `Failed to fetch the pull request from the event's payload.`,
      )
      return
    }
    if (!thePR.merged) {
      core.info(`Nothing to do since the pull request is not merged. Bye.`)
      return
    }

    // get open PRs
    const client: github.GitHub = new github.GitHub(token, {
      previews: ['shadow-cat'], // to use "The Draft Pull Request API"
    })

    const { status, data: pullRequests } = await client.pulls.list(
      github.context.repo,
    )
    if (status !== 200) {
      core.setFailed(`Failed to get pull requests: status ${status}`)
      return
    }

    // identify next PRs
    let nextPRs: any[] = []
    for (const pr of pullRequests) {
      const baseIssueNumbers: number[] = new PRAnalyzer(pr).baseIssues()
      core.debug(
        `Base issues of #${pr.number} are [${baseIssueNumbers.join(', ')}]`,
      )
      if (!baseIssueNumbers.includes(thePR.number)) {
        continue
      }
      const nextPR = pr

      if (!nextPR.draft) {
        // fail but continue
        core.setFailed(
          `#${nextPR.number} pull request is already released for review.`,
        )
        continue
      }

      nextPRs.push(nextPR)
    }

    //
    // release next PRs
    //

    // NOTE: Use the GraphQL API v4 to update draft statuses.
    // We tried to use the REST API v3 before, but it does not work well.
    // It seems that the REST API v3 cannot update draft statuses.
    // In detail, see and run old codes through Git.

    // - prepare to use "The Draft Pull Request API"
    // NOTE: 'defaults' is not defined in the type, but the value exists.
    const graphql = client.graphql['defaults']({
      mediaType: {
        previews: ['shadow-cat'],
      },
    })

    // - release next PRs
    for (const nextPR of nextPRs) {
      await graphql(
        `
          mutation($input: MarkPullRequestReadyForReviewInput!) {
            markPullRequestReadyForReview(input: $input) {
              clientMutationId
            }
          }
        `,
        {
          input: {
            pullRequestId: nextPR.node_id,
          },
        },
      )

      core.info(`Released #${nextPR.number} pull request for review!`)
    }

    core.info('Complete!')
  } catch (error) {
    core.setFailed(error)
  }
}

run()
