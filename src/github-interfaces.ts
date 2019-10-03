// NOTE: Pick up only necessary parts from @actions/github etc.

export interface PullRequest {
  body: string
  draft: Boolean
  merged: Boolean
  node_id: string
  number: number
}

export interface GraphQl {
  (query: string, variables?: GraphQlVariables): Promise<GraphQlQueryResponse>
  defaults: (options: any) => GraphQl
}

export interface GraphQlVariables {
  [key: string]: any
}

export interface GraphQlQueryResponse {}

export interface Context {
  eventName: string
  repo: { owner: string; repo: string }
  payload: WebhookPayload
}

export interface WebhookPayload {
  action?: string
  pull_request?: PullRequest
}
