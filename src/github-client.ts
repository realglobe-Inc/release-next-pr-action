import * as core from '@actions/core'
import * as github from '@actions/github'

export default class {
  // third-party client objects
  _rest: github.GitHub // REST API v3
  _graphql: any // GraphQL API v4

  constructor(token: string) {
    this._rest = new github.GitHub(token, {
      previews: ['shadow-cat'], // to use "The Draft Pull Request API"
    })
    // NOTE: 'defaults' is not defined in the type, but the value exists.
    this._graphql = this._rest.graphql['defaults']({
      mediaType: {
        previews: ['shadow-cat'], // to use "The Draft Pull Request API"
      },
    })
  }

  async getOpenPRs(context: any): Promise<{ data: any[]; error: string }> {
    const { status, data: pullRequests } = await this._rest.pulls.list(
      context.repo,
    )
    if (status !== 200) {
      core.setFailed(`Failed to get pull requests: status ${status}`)
      return {
        data: [],
        error: `Failed to get pull requests: status ${status}`,
      }
    }
    return { data: pullRequests, error: '' }
  }

  // NOTE: Use the GraphQL API v4 to update draft statuses.
  // We tried to use the REST API v3 before, but it does not work well.
  // It seems that the REST API v3 cannot update draft statuses.
  // In detail, see and run old codes through Git.
  async releasePR(prNodeId: string): Promise<{ error: string }> {
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
            pullRequestId: prNodeId,
          },
        },
      )
      return { error: '' }
    } catch (err) {
      return { error: err.toString() }
    }
  }
}
