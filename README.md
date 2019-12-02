# Release Next Pull Requests

It is an ideal situation that any pull request does not depend on another one.
But practically, such dependencies are often inevitable, especially when
reviewers cannot review immediately because of their busyness and pull requests
keep on being piled up.

And so, **"serial pull requests"** occur. They are a queue which consists of
some pull requests each of which is a continuation of the previous pull
request. This is an example:

```txt
                 br2
                  |
                  |
                  * add a text file logger using the base
         br1    /
          |   /
          | /
          * add a stdio logger
          |
          * add a base of logger
master  /
  |   /
  | /
  * add a Money class
  |
  * add a User class
  |
```

```txt
#1 pull-request-1

branch: master <- br1

compare changes:

|
* add a base of logger
|
* add a stdio logger
|

```

```txt
#2 pull-request-2

branch: master <- br2

compare changes:

|
* add a base of logger
|
* add a stdio logger
|
* add a text file logger using the base
|

```

This GitHub Action helps you review serial pull requests in right sequence.

## Usage

### Preparation

#### 1. Create an access token for GitHub API

Create an access token for GitHub API. It need to have the `repo` scope.

#### 2. Register the token as a secret of your repository

Register a "secret" as below:

*   Name
    *   anything e.g. `MY_GITHUB_TOKEN`
*   Value
    *   the token which is created in the previous step

To register a "secret", open your repository page and open
`Settings -> Secrets`. Detail is described
[here](https://help.github.com/en/articles/virtual-environments-for-github-actions#creating-and-using-secrets-encrypted-variables).

#### 3. Create a workflow file and commit it to your repository

Refer to
[<.github/workflows/release_next_pr.yml>](.github/workflows/release_next_pr.yml),
a working sample.

### Making serial pull requests

#### 1. Use draft pull requests

When you create a pull request as a continuation of another one,
you had better to create it as a draft pull request. If you do not,
it is hard for reviewers to decide which pull request they should review first.

So, this GitHub Action requires you to create a continuation pull request
**as a draft one**!

#### 2. Specify base pull requests

If there is pull request \#1 and \#2, and \#2 is a continuation of \#1,
we call \#2 **"a next pull request"** of \#1 and
\#1 **"a base pull request"** of \#2.

Base pull requests are indicated by the comment of the next pull request
as below:

```txt
after [#n1[, #n2[, ... [, #nn]...]]]
```

`#n1` to `#nn` is the issue number of base pull requests. Multiple base pull
requests can be specified.

You can write this statement at any line of the comment, but you need to put it
at the beginning of the line.

*Example 1:*

```txt
after #5

Please merge!
```

*Example 2:*

```txt
Please merge!

cf.
after #12, #14, #16
```

**CAUTION:** "Base pull requests" are a different concept from
GitHub's "base branch". The base branch means the target which you will merge
a branch into.

### Reviewing and merging serial pull requests

This is the previous example, but is changed a bit:
Information is added whether each pull request is draft.

```txt
                 br2
                  |
                  |
                  * add a text file logger using the base
         br1    /
          |   /
          | /
          * add a stdio logger
          |
          * add a base of logger
master  /
  |   /
  | /
  * add a Money class
  |
  * add a User class
  |
```

```txt
#1 pull-request-1 [ready-for-review]

branch: master <- br1

compare changes:

|
* add a base of logger
|
* add a stdio logger
|

```

```txt
#2 pull-request-2 [draft]

branch: master <- br2

compare changes:

|
* add a base of logger
|
* add a stdio logger
|
* add a text file logger using the base
|

```

If "making serial pull requests" steps are done, `pull-request-2` should be
a draft one. So you can merge `pull-request-1` only.

After it was merged with no modification, the situation changes as below:

```txt
                              br2
                               |
master                         |
  |                            * add a text file logger using the base
  |                            |
  * add a stdio logger         * add a stdio logger
  |                            |
  * add a base of logger       * add a base of logger
  |                          /
  |-------------------------
  |
  * add a Money class
  |
  * add a User class
  |
```

```txt
#2 pull-request-2 [ready-for-review]

branch: master <- br2

compare changes:

|
* add a base of logger
|
* add a stdio logger
|
* add a text file logger using the base
|

```

When `pull-request-1` is merged, `pull-request-2` is automatically changed
from a draft one to a ready-for-review one by this GitHub Action
as long as the comment of `pull-request-2` specifies that `pull-request-1` is
its base pull request.

So you can merge `pull-request-2` next. However, the comparison between
`pull-request-2` and `master` contains some noise. There is three commits
in the comparison, but true difference between them are only the last commit:
"add a text file logger using the base". We recommend removing noise
before reviewing `pull-request-2` by rebasing `pull-request-2` onto `master`
or merging `master` into `pull-request-2`.

If you add some modification commits when merging `pull-request-1`, you
had better to remove noise or resolve conflicts in a similar way.

## Contribution

### a Prefix of a Commit Message

|     Emoji      |   Emoji String   | Meaning                                            |      Subject of Commit      |
|:--------------:|:----------------:|:-------------------------------------------------- |:---------------------------:|
|    :notes:     |    `:notes:`     | improve behavior or API                            |      Major update (*1)      |
|   :sparkles:   |   `:sparkles:`   | implement a new function or the first commit       |      Minor update (*1)      |
|     :bug:      |     `:bug:`      | fix a bug                                          |      Patch update (*1)      |
|    :horse:     |    `:horse:`     | improve performance                                | Non-functional feature (*2) |
|     :lock:     |     `:lock:`     | improve security                                   | Non-functional feature (*2) |
|     :mag:      |     `:mag:`      | about test codes                                   |       Maintenability        |
|     :memo:     |     `:memo:`     | about documentation                                |       Maintenability        |
| :green_heart:  | `:green_heart:`  | refactor                                           |       Maintenability        |
|   :arrow_up:   |   `:arrow_up:`   | update dependencies (includes code changes for it) |       Maintenability        |
|    :wrench:    |    `:wrench:`    | configure for development or CI tools              |       Maintenability        |
|   :bookmark:   |   `:bookmark:`   | about a release                                    |           Release           |
|    :rocket:    |    `:rocket:`    | about a deploy                                     |           Deploy            |
| :construction: | `:construction:` | WIP (work in progress)                             |          Temporary          |

*1) By the semantic versioning\
*2) These may belong to minor update.
