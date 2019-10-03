import * as core from '@actions/core'
import * as github from '@actions/github'

import GitHubClient from './github-client'
import PRAnalyzer from './pr-analyzer'

async function run() {
  try {
    // get inputs
    const token: string = core.getInput('github-token', { required: true })

    // check context
    if (!isTargetContext(github.context)) {
      return
    }
    const mergedPR: any = github.context.payload.pull_request

    // get open PRs
    const client = new GitHubClient(token)
    const { data: pullRequests, error: getPRsError } = await client.getOpenPRs(
      github.context,
    )
    if (getPRsError) {
      core.setFailed(getPRsError)
      return
    }

    // identify next PRs
    let nextPRs: any[] = []
    for (const pr of pullRequests) {
      const baseIssueNumbers: number[] = new PRAnalyzer(pr).baseIssues()
      core.debug(
        `Base issues of #${pr.number} are [${baseIssueNumbers.join(', ')}]`,
      )
      if (!baseIssueNumbers.includes(mergedPR.number)) {
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
      const { error: releaseError } = await client.releasePR(nextPR.node_id)
      if (releaseError) {
        core.setFailed(releaseError)
        return
      }

      core.info(`Released #${nextPR.number} pull request for review!`)
    }

    core.info('Complete!')
  } catch (err) {
    core.setFailed(err)
  }
}

function isTargetContext(context): Boolean {
  // check the event's kind
  const eventName: string = context.eventName
  if (eventName !== 'pull_request') {
    core.info(
      `Nothing to do since the event is "${eventName}", not "pull_request". Bye.`,
    )
    return false
  }

  // check the pull_request event's kind
  const payload = context.payload
  if (payload.action !== 'closed') {
    core.info(
      `Nothing to do since the pull request's action is "${payload.action}", not "closed". Bye.`,
    )
    return false
  }

  // check whether the PR is merged
  const pr = payload.pull_request
  if (pr == null) {
    core.setFailed(`Failed to fetch the pull request from the event's payload.`)
    return false
  }
  if (!pr.merged) {
    core.info(`Nothing to do since the pull request is not merged. Bye.`)
    return false
  }

  return true
}

run()
