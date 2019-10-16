import * as core from '@actions/core'
import * as github from '@actions/github'

import { PullRequest, GraphQl, Context } from './github-interfaces'

export default class {
  // third-party client objects
  _rest: github.GitHub // REST API v3
  _graphql: GraphQl // GraphQL API v4

  constructor(token: string) {
    this._rest = new github.GitHub(token, {
      previews: ['shadow-cat'], // to use "The Draft Pull Request API"
    })
    const graphql = this._rest.graphql as GraphQl
    this._graphql = graphql.defaults({
      mediaType: {
        previews: ['shadow-cat'], // to use "The Draft Pull Request API"
      },
    })
  }

  async getOpenPullRequests(
    context: Context,
  ): Promise<{ data: PullRequest[]; error: string }> {
    const {
      status,
      data: pullRequests,
    }: { status: number; data: any } = await this._rest.pulls.list(context.repo)
    if (status !== 200) {
      core.setFailed(`Failed to get pull requests: status ${status}`)
      return {
        data: [],
        error: `Failed to get pull requests: status ${status}`,
      }
    }
    return { data: pullRequests as PullRequest[], error: '' }
  }

  // NOTE: Use the GraphQL API v4 to update draft statuses.
  // We tried to use the REST API v3 before, but it does not work well.
  // It seems that the REST API v3 cannot update draft statuses.
  // In detail, see and run old codes through Git.
  async releasePullRequest(pullNodeId: string): Promise<{ error: string }> {
    try {
      await this._graphql(
        `
          mutation($input: MarkPullRequestReadyForReviewInput!) {
            markPullRequestReadyForReview(input: $input) {
              clientMutationId
            }
          }
        `,
        {
          input: {
            pullRequestId: pullNodeId,
          },
        },
      )
      return { error: '' }
    } catch (err) {
      return { error: err.toString() }
    }
  }
}
