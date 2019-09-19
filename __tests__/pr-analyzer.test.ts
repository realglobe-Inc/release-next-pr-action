import PRAnalyzer from '../src/pr-analyzer'

describe('PRAnalyzer', () => {
  describe('baseIssues', () => {
    const cases = [
      {
        behavior: 'ignores if keyword is different',
        prBody: 'favorite #42',
        expected: [],
      },
      {
        behavior: 'ignores numbers which not follows the issue number format',
        prBody: 'after 42',
        expected: [],
      },
      {
        behavior: 'gets base issues if keyword is "after"',
        prBody: 'after #42',
        expected: [42],
      },
      {
        behavior: 'gets multiple base issues',
        prBody: 'after #16, #9, #25',
        expected: [16, 9, 25],
      },
      {
        behavior: 'ignores trailing texts',
        prBody: 'after #9, 25th century boy, #16',
        expected: [9],
      },
      {
        behavior: 'ignores spaces',
        prBody: '  \t  after #9,#16,  #25,\t#36 ,#4 9,#64',
        expected: [9, 16, 25, 36, 4], // texts after " 9" is trailing texts
      },
      {
        behavior: 'ignores continued lines',
        prBody: 'after #9, #16,\n#25',
        expected: [9, 16],
      },
      {
        behavior: 'ignores if keyword is not at the top of the line',
        prBody: `//after #42
        this    after #42    statement is commented out.`,
        expected: [],
      },
      {
        behavior: 'gets base issues from multiple statements',
        prBody: `hello
        after #16
        good-bye
        after #9, #25`,
        expected: [16, 9, 25],
      },
    ]

    cases.forEach(({ behavior, prBody, expected }) => {
      it(behavior, async () => {
        const pr = { body: prBody }
        const analyzer = new PRAnalyzer(pr)
        expect(analyzer.baseIssues()).toEqual(expected)
      })
    })
  })
})
