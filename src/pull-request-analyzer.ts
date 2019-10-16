import { PullRequest } from './github-interfaces'

export default class {
  _pull: PullRequest
  constructor(pull: PullRequest) {
    this._pull = pull
  }

  baseIssues(): number[] {
    const issues: number[] = []

    const statementReg = /^[ \t]*after[ \t]*((?:#(?:\d+)[ \t]*,?[ \t]*)+)/gim
    let statementMatch: string[] | null
    while ((statementMatch = statementReg.exec(this._pull.body)) != null) {
      const issuesText: string = statementMatch[1]

      const issueReg = /#(\d+)/g
      let issueMatch: string[] | null
      while ((issueMatch = issueReg.exec(issuesText)) != null) {
        const issueNumber: number = Number(issueMatch[1])

        issues.push(issueNumber)
      }
    }

    return issues
  }
}
