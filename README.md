# sf-plugin-check-coverage

> sf/sfdx plugin to check the code coverage of a test run and per file

[![Actions Status](https://github.com/amtrack/sf-plugin-check-coverage/workflows/Test%20and%20Release/badge.svg)](https://github.com/amtrack/sf-plugin-check-coverage/actions)

This plugin uses the coverage information from `sf apex run test` and `sf apex get test` stored in a directory to enforce the Apex class and trigger coverage to be above a given threshold (in percent).
If the code coverage is below the threshold, the command fails.

## Installation

```
sf plugins install sf-plugin-check-coverage
```

## Prerequisites

This plugin makes use of the files in the coverage directory.

Example content of the `coverage` directory:

```console
$ tree coverage
coverage
├── test-result-7075t00001mmTZw-codecoverage.json
├── test-result-7075t00001mmTZw-junit.xml
├── test-result-7075t00001mmTZw.json
├── test-result-codecoverage.json
├── test-result.txt
└── test-run-id.txt

1 directory, 6 files
```

You can retrieve the code coverage from the target org to a directory (here: `coverage`)

- when running tests

  ```console
  sf apex run test --code-coverage --output-dir coverage --wait 60
  ```

- or from a completed test run

  ```console
  sf apex get test --code-coverage --output-dir coverage --test-run-id 7070300002Y0bgjAAB
  ```

The relevant flags are `--code-coverage --output-dir coverage` (short: `-c -d coverage`).

## Usage

We'll assume you've stored the code coverage in the `coverage` directory.

By default only the test run coverage is enforced (default: 75%):

```console
sf coverage check --coverage-dir coverage
```

Enforce higher test run coverage:

```console
sf coverage check --coverage-dir coverage --test-run-coverage 80
```

Enforce per-file coverage:

```console
sf coverage check --coverage-dir coverage --per-file-coverage 75
```

## Advanced Usage

### Ignoring coverage of certain files

Sometimes specific classes cannot be covered with tests.

Create a `.sfcoverageignore` with the following content:

```
force-app/main/default/classes/CommunityController.cls
```

and add the `--ignore-file` flag:

```console
sf coverage check -d coverage --ignore-file .sfcoverageignore
```

If you don't want to maintain such a file, you can alternatively use the following trick using a line comment in the files you want to ignore:

In `force-app/main/default/classes/CommunityController.cls`, add the line comment `// SKIP_COVERAGE_CHECK` somewhere.

Generate the ignore file on the fly listing all files containing this line comment:

```console
sf coverage check -d coverage --ignore-file <(grep -l -r "// SKIP_COVERAGE_CHECK" force-app)
```

Note: Bash Process Substitution does not work on Windows with Git Bash in Node.js.
