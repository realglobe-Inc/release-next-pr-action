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

    // release next PRs
    for (const nextPR of nextPRs) {
      // NOTE: This is an ideal way but `draft` property is not supported...
      // const { status } = await client.pulls.update({
      //   ...github.context.repo,
      //   pull_number: nextPR.number,
      //   draft: false, // unsupported!
      // })
      // NOTE: This is the second best way, using the low-level method.
      const { status } = await client.request(
        'PATCH /repos/:owner/:repo/pulls/:pull_number',
        {
          ...github.context.repo,
          pull_number: nextPR.number,
          draft: false,
          mediaType: {
            previews: ['shadow-cat'], // to use "The Draft Pull Request API"
          },
        },
      )

      if (status !== 200) {
        // fail but continue
        core.setFailed(
          `Failed to release #${nextPR.number} pull request: status ${status}`,
        )
        continue
      }
      core.info(`Released #${nextPR.number} pull request for review!`)
    }

    core.info('Complete!')
  } catch (error) {
    core.setFailed(error)
  }
}

run()
