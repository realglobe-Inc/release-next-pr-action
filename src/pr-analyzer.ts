export default class {
  _pr: any
  constructor(pr) {
    this._pr = pr
  }

  baseIssues(): number[] {
    const issues: number[] = []

    const statementReg = /^[ \t]*after[ \t]*((?:#(?:\d+)[ \t]*,?[ \t]*)+)/gim
    let statementMatch: any
    while ((statementMatch = statementReg.exec(this._pr.body)) != null) {
      const issuesText: string = statementMatch[1]

      const issueReg = /#(\d+)/g
      let issueMatch: any
      while ((issueMatch = issueReg.exec(issuesText)) != null) {
        const issueNumber: number = Number(issueMatch[1])

        issues.push(issueNumber)
      }
    }

    return issues
  }
}
