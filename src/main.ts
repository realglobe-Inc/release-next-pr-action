import * as core from '@actions/core'
import * as github from '@actions/github'

import GitHubClient from './github-client'
import { PullRequest, Context, WebhookPayload } from './github-interfaces'
import PRAnalyzer from './pr-analyzer'

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
    const mergedPR: PullRequest = payload.pull_request!

    // get open PRs
    const client = new GitHubClient(token)
    const {
      data: pullRequests,
      error: getPRsError,
    }: { data: PullRequest[]; error: string } = await client.getOpenPRs(context)
    if (getPRsError) {
      core.setFailed(getPRsError)
      return
    }

    // identify next PRs
    let nextPRs: PullRequest[] = []
    for (const pr of pullRequests) {
      const baseIssueNumbers: number[] = new PRAnalyzer(pr).baseIssues()
      core.debug(
        `Base issues of #${pr.number} are [${baseIssueNumbers.join(', ')}]`,
      )
      if (!baseIssueNumbers.includes(mergedPR.number)) {
        continue
      }
      const nextPR: PullRequest = pr

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
      const { error: releaseError }: { error: string } = await client.releasePR(
        nextPR.node_id,
      )
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

  // check whether the PR is merged
  // NOTE: `payload` contains `pull_request` since `context.eventName` is
  // 'pull_request'.
  const pr: PullRequest = payload.pull_request!
  if (!pr.merged) {
    core.info(`Nothing to do since the pull request is not merged. Bye.`)
    return false
  }

  return true
}

run()
