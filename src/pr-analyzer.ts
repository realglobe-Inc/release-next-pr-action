export default class {
  pr: any
  constructor(pr) {
    this.pr = pr
  }

  baseIssues(): number[] {
    const issues: number[] = []

    const statementReg = /^[ \t]*after[ \t]*((?:#(?:\d+)[ \t]*,?[ \t]*)+)/gim
    let statementMatch
    while ((statementMatch = statementReg.exec(this.pr.body)) != null) {
      const issuesText = statementMatch[1]

      const issueReg = /#(\d+)/g
      let issueMatch
      while ((issueMatch = issueReg.exec(issuesText)) != null) {
        const issueNumber = Number(issueMatch[1])

        issues.push(issueNumber)
      }
    }

    return issues
  }
}
