import PullRequestAnalyzer from '../src/pull-request-analyzer'
import { PullRequest } from '../src/github-interfaces'

describe('PullRequestAnalyzer', () => {
  describe('baseIssues', () => {
    const cases = [
      {
        behavior: 'ignores if keyword is different',
        pullBody: 'favorite #42',
        expected: [],
      },
      {
        behavior: 'ignores numbers which not follows the issue number format',
        pullBody: 'after 42',
        expected: [],
      },
      {
        behavior: 'gets base issues if keyword is "after"',
        pullBody: 'after #42',
        expected: [42],
      },
      {
        behavior: 'ignores the cases of the keywords',
        pullBody: 'AfTeR #42',
        expected: [42],
      },
      {
        behavior: 'gets multiple base issues',
        pullBody: 'after #16, #9, #25',
        expected: [16, 9, 25],
      },
      {
        behavior: 'ignores trailing texts',
        pullBody: 'after #9, 25th century boy, #16',
        expected: [9],
      },
      {
        behavior: 'ignores spaces',
        pullBody: '  \t  after #9,#16,  #25,\t#36 ,#4 9,#64',
        expected: [9, 16, 25, 36, 4], // texts after " 9" is trailing texts
      },
      {
        behavior: 'ignores continued lines',
        pullBody: 'after #9, #16,\n#25',
        expected: [9, 16],
      },
      {
        behavior: 'ignores if keyword is not at the top of the line',
        pullBody: `//after #42
        this    after #42    statement is commented out.`,
        expected: [],
      },
      {
        behavior: 'gets base issues from multiple statements',
        pullBody: `hello
        after #16
        good-bye
        after #9, #25`,
        expected: [16, 9, 25],
      },
    ]

    cases.forEach(({ behavior, pullBody, expected }) => {
      it(behavior, async () => {
        const pull: PullRequest = {
          body: pullBody,
          draft: false,
          merged: false,
          node_id: '',
          number: 0,
        }
        const analyzer = new PullRequestAnalyzer(pull)
        expect(analyzer.baseIssues()).toEqual(expected)
      })
    })
  })
})
