<h2 align="center">
  🔄 LockBlocks
</h2>
<h3 align="center">
  Node.js utility for updating projects created from starters.
</h3>
<p align="center">
  <a href="https://badge.fury.io/js/lockblocks" target="_blank" rel="noopener noreferrer"><img src="https://badge.fury.io/js/lockblocks.svg" alt="npm Version" /></a>&nbsp;
  <a href="https://github.com/justinmahar/lockblocks/" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/badge/GitHub-Source-success" alt="View project on GitHub" /></a>&nbsp;
  <a href="https://github.com/justinmahar/lockblocks/actions?query=workflow%3ADeploy" target="_blank" rel="noopener noreferrer"><img src="https://github.com/justinmahar/lockblocks/workflows/Deploy/badge.svg" alt="Deploy Status" /></a>
</p>
<!-- [lock:donate-badges] 🚫--------------------------------------- -->
<p align="center">
  <a href="https://ko-fi.com/justinmahar"><img src="https://img.shields.io/static/v1?label=Buy%20me%20a%20coffee&message=%E2%9D%A4&logo=KoFi&color=%23fe8e86" alt="Buy me a coffee" /></a>&nbsp;<a href="https://github.com/sponsors/justinmahar" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/static/v1?label=Sponsor&message=%E2%9D%A4&logo=GitHub&color=%23fe8e86" alt="Sponsor"/></a>
</p>
<!-- [/lock:donate-badges] ---------------------------------------🚫 -->

## Documentation

Read the **[official documentation](https://justinmahar.github.io/lockblocks/)**.

## Overview

LockBlocks is a Node.js command line utility that allows you to easily update projects created from a starter. 

### The Problem

Starters are an excellent way to hit the ground running with any new project without needing to write a bunch of boilerplate code. Simply clone the starter and build.

However, the moment you create a new project from a starter, you create a new maintenance fork. If you update the starter, any projects created from that starter will also need to be updated, and usually this must be done manually.

This can quickly snowball into a lot of work if you are maintaining several projects created from the same starter. Bugs can easily be introduced when manually updating projects, or you may simply forget to copy updates to each project.

### The Solution

Enter LockBlocks. With LockBlocks, you can configure an updater that specifies which files and directories should be updated from the starter.

You can specify fields to update in JSON and YAML files, such as your dependencies in `package.json`, with granular control over how the updates are made for each field (merge, fill, replace, etc).

In addition, you can specify blocks of code that will be pulled from the starter when updating. This gives you a lot of control over what can be maintained in the starter, as you can lock parts of a file that are maintained in the starter, while leaving the rest of the file to be changed as the developer sees fit.

### Features include:

- 🔄 **Create the updater your starter project is missing.**
  - Make maintenance of child projects easier with a custom updater.
- 🟥 **Lock blocks of code.**
  - Use lock tags around blocks of code to synchronize those blocks with your starter.
- 🗂️ **Rename, replace, fill, delete, and more.**
  - Flexible and customizable file and directory update options.
- 📄 **Fine-grained config file updates.**
  - Update `package.json` scripts and dependencies, or any other JSON or YAML files, as you see fit!
- 🪵 **Verbose logging.**
  - Know exactly what changed and what was updated.

<!-- [lock:donate] 🚫--------------------------------------- -->

## Donate 

If this project helped you, please consider buying me a coffee or sponsoring me. Your support is much appreciated!

<a href="https://ko-fi.com/justinmahar"><img src="https://img.shields.io/static/v1?label=Buy%20me%20a%20coffee&message=%E2%9D%A4&logo=KoFi&color=%23fe8e86" alt="Buy me a coffee" /></a>&nbsp;<a href="https://github.com/sponsors/justinmahar" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/static/v1?label=Sponsor&message=%E2%9D%A4&logo=GitHub&color=%23fe8e86" alt="Sponsor"/></a>

<!-- [/lock:donate] ---------------------------------------🚫 -->

## Table of Contents 

- [Documentation](#documentation)
- [Overview](#overview)
  - [The Problem](#the-problem)
  - [The Solution](#the-solution)
  - [Features include:](#features-include)
- [Donate](#donate)
- [Table of Contents](#table-of-contents)
- [Installation](#installation)
- [Quick Start](#quick-start)
  - [Git Approach](#git-approach)
- [Usage](#usage)
- [How It Works](#how-it-works)
  - [Order of Operations](#order-of-operations)
- [TypeScript](#typescript)
- [Icon Attribution](#icon-attribution)
- [Contributing](#contributing)
- [⭐ Found It Helpful? Star It!](#-found-it-helpful-star-it)
- [License](#license)

## Installation

```
npm i --save-dev lockblocks
```

## Quick Start

Create a new file at the root of your starter project called `lockblocks.yml`:

```yaml
# lockblocks.yml
renameFiles: []
replaceFiles:
  - lockblocks.yml
fillFiles: []
deleteFiles: []
excludePaths:
  - .git
  - .lockblocks
  - node_modules
updateJson: 
  - path: package.json
    root:
      fill: true
    updateFields:
      - key: version
        as: starterVersion
      - key: scripts
        merge: true
      - key: dependencies
        merge: true
      - key: devDependencies
        merge: true
updateYaml: []
```

> This config will keep your `lockblocks.yml` and npm scripts and packages up to date, and will copy the starter's `version` in `package.json` as `starterVersion`.

Then create an npm script in `package.json` to execute LockBlocks using a git project as the origin and the current project as the target. See below.

### Git Approach

To update your project with LockBlocks using a git project as the origin, add this script to `package.json`:

```json
"scripts": {
  "update": "git clone -q git@github.com:my-username/my-starter.git ./.lockblocks && lockblocks ./.lockblocks . --verbose && rm -rf .lockblocks"
},
```

...where `git@github.com:my-username/my-starter.git` is the location to your starter git project.

This script will silently clone your project to the `.lockblocks` directory, then run LockBlocks using that dir as the origin and the current directory as the target. The `.lockblocks` directory will then be deleted when finished.

With this approach, be sure `.lockblocks` is specified in [`excludePaths`](#excludepaths).

## Usage

See the [Usage Documentation](https://justinmahar.github.io/lockblocks/?path=/story/api-usage--page) for full usage docs.

## How It Works

This utility uses a config file, `lockblocks.yml`, to determine which files and directories to update in your project. 

It also scans all files in the starter (origin directory) for special tags that specify additional updates to make, including blocks of code.

You can reference the order in which LockBlocks performs updates below.

### Order of Operations

LockBlocks operates in the following order:

1. **Rename files** - Files are renamed as per [`renameFiles`](#renamefiles) and the [`lock-rename`](#rename-file-tags) tags found in origin.
1. **Replace files** - Files are replaced as per [`replaceFiles`](#replacefiles) and the [`lock-all`](#replace-file-tag) tags found in origin.
1. **Fill files** - Missing files are filled in as per [`fillFiles`](#fillfiles).
1. **Delete files** - Files are deleted as per [`deleteFiles`](#deletefiles).
1. **Replace code blocks** - Code blocks are updated as per the [`lock` block tags](#code-block-tags) found in origin.
1. **Update JSON** - All JSON files will be updated as per [`updateJson`](#updatejson-and-updateyaml).
1. **Update YAML** - All YAML files will be updated as per [`updateYaml`](#updatejson-and-updateyaml).

<!-- [lock:typescript] 🚫--------------------------------------- -->

## TypeScript

Type definitions have been included for [TypeScript](https://www.typescriptlang.org/) support.

<!-- [/lock:typescript] ---------------------------------------🚫 -->

<!-- [lock:icon] 🚫--------------------------------------- -->

## Icon Attribution

Favicon by [Twemoji](https://github.com/twitter/twemoji).

<!-- [/lock:icon] ---------------------------------------🚫 -->

<!-- [lock:contributing] 🚫--------------------------------------- -->

## Contributing

Open source software is awesome and so are you. 😎

Feel free to submit a pull request for bugs or additions, and make sure to update tests as appropriate. If you find a mistake in the docs, send a PR! Even the smallest changes help.

For major changes, open an issue first to discuss what you'd like to change.

<!-- [/lock:contributing] --------------------------------------🚫 -->

## ⭐ Found It Helpful? [Star It!](https://github.com/justinmahar/lockblocks/stargazers)

If you found this project helpful, let the community know by giving it a [star](https://github.com/justinmahar/lockblocks/stargazers): [👉⭐](https://github.com/justinmahar/lockblocks/stargazers)

## License

See [LICENSE.md](https://justinmahar.github.io/lockblocks/?path=/story/license--page).