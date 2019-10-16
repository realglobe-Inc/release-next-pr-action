import * as core from '@actions/core'
import * as github from '@actions/github'

import GitHubClient from './github-client'
import { PullRequest, Context, WebhookPayload } from './github-interfaces'
import PullRequestAnalyzer from './pull-request-analyzer'

async function run(): Promise<void> {
  try {
    // get inputs
    const token: string = core.getInput('github-token', { required: true })

    // check context
    const context = github.context as Context
    if (!isTargetContext(context)) {
      return
    }
    const payload: WebhookPayload = context.payload
    // NOTE: `payload` contains `pull_request` since `context` passed
    // `isTargetContext` check.
    const mergedPull: PullRequest = payload.pull_request!

    // get open pull requests
    const client = new GitHubClient(token)
    const {
      data: pulls,
      error: getPullsError,
    }: {
      data: PullRequest[]
      error: string
    } = await client.getOpenPullRequests(context)
    if (getPullsError) {
      core.setFailed(getPullsError)
      return
    }

    // identify next pull requests
    let nextPulls: PullRequest[] = []
    for (const pull of pulls) {
      const analyzer = new PullRequestAnalyzer(pull)
      const baseIssueNumbers: number[] = analyzer.baseIssues()
      core.debug(
        `Base issues of #${pull.number} are [${baseIssueNumbers.join(', ')}]`,
      )
      if (!baseIssueNumbers.includes(mergedPull.number)) {
        continue
      }
      const nextPull: PullRequest = pull

      if (!nextPull.draft) {
        // fail but continue
        core.setFailed(
          `#${nextPull.number} pull request is already released for review.`,
        )
        continue
      }

      nextPulls.push(nextPull)
    }

    // release next pull requests
    for (const nextPull of nextPulls) {
      const {
        error: releaseError,
      }: { error: string } = await client.releasePullRequest(nextPull.node_id)
      if (releaseError) {
        core.setFailed(releaseError)
        return
      }

      core.info(`Released #${nextPull.number} pull request for review!`)
    }

    core.info('Complete!')
  } catch (err) {
    core.setFailed(err)
  }
}

function isTargetContext(context: Context): Boolean {
  // check the event's kind
  const eventName: string = context.eventName
  if (eventName !== 'pull_request') {
    core.info(
      `Nothing to do since the event is "${eventName}", not "pull_request". Bye.`,
    )
    return false
  }

  // check the pull_request event's kind
  const payload: WebhookPayload = context.payload
  if (payload.action !== 'closed') {
    core.info(
      `Nothing to do since the pull request's action is "${payload.action}", not "closed". Bye.`,
    )
    return false
  }

  // check whether the pull request is merged
  // NOTE: `payload` contains `pull_request` since `context.eventName` is
  // 'pull_request'.
  const pull: PullRequest = payload.pull_request!
  if (!pull.merged) {
    core.info(`Nothing to do since the pull request is not merged. Bye.`)
    return false
  }

  return true
}

run()
