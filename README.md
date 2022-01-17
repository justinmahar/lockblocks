<h2 align="center">
  <a href="https://github.com/justinmahar/lockblocks">LockBlocks</a>
</h2>
<h3 align="center">
  Node.js utility for updating projects created from starters.
</h3>
<p align="center">
  <a href="https://badge.fury.io/js/lockblocks">
    <img src="https://badge.fury.io/js/lockblocks.svg" alt="npm Version"/>
  </a>
  <a href="https://github.com/justinmahar/lockblocks/actions?query=workflow%3ATests">
    <img src="https://github.com/justinmahar/lockblocks/workflows/Tests/badge.svg" alt="Tests Status"/>
  </a>
</p>

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

## Table of Contents

- [Overview](#overview)
  - [The Problem](#the-problem)
  - [The Solution](#the-solution)
  - [Features include:](#features-include)
- [Table of Contents](#table-of-contents)
- [Installation](#installation)
- [Quick Start](#quick-start)
  - [Git Approach](#git-approach)
  - [npm Approach](#npm-approach)
- [How It Works](#how-it-works)
  - [Order of Operations](#order-of-operations)
- [Usage](#usage)
  - [Config (lockblocks.yml)](#config-lockblocksyml)
    - [renameFiles](#renamefiles)
    - [replaceFiles](#replacefiles)
    - [fillFiles](#fillfiles)
    - [deleteFiles](#deletefiles)
    - [excludePaths](#excludepaths)
    - [updateJson and updateYaml](#updatejson-and-updateyaml)
    - [log](#log)
  - [Lock Tags](#lock-tags)
    - [Replace File Tag](#replace-file-tag)
    - [Code Block Tags](#code-block-tags)
    - [Rename File Tags](#rename-file-tags)
    - [Ignore Tag](#ignore-tag)
    - [Tag Ejection](#tag-ejection)
- [Logging](#logging)
- [TypeScript](#typescript)
- [Contributing](#contributing)
- [⭐ Found It Helpful? Star It!](#-found-it-helpful-star-it)
- [MIT License](#mit-license)

## Installation

```
npm i lockblocks
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
        replace: true
      - key: scripts
        merge: true
      - key: dependencies
        merge: true
      - key: devDependencies
        merge: true
updateYaml: []
```

> This config will keep your `lockblocks.yml` and npm scripts and packages up to date, and will copy the starter's `version` in `package.json` as `starterVersion`.

Then create an npm script in `package.json` to execute LockBlocks using a git project or npm package as the origin and the current project as the target. See below.

### Git Approach

To update your project with LockBlocks using a git project as the origin, add this script to `package.json`:

```json
"scripts": {
  "update": "git clone git@github.com:my-username/my-starter.git ./.lockblocks && lockblocks ./.lockblocks . && rm -rf .lockblocks"
},
```

...where `git@github.com:my-username/my-starter.git` is the location to your starter git project.

This script will clone your project to the `.lockblocks` directory, then run LockBlocks using that dir as the origin and the current directory as the target. The `.lockblocks` directory will then be deleted when finished.

With this approach, be sure `.lockblocks` is specified in [`excludePaths`](#excludepaths).

### npm Approach

To update your project with LockBlocks using an npm package as the origin, add this script to `package.json`:

```json
"scripts": {
  "update": "npm i my-starter@latest && lockblocks ./node_modules/my-starter ."
},
```

...where `my-starter` is the name of your npm package.

With this approach, LockBlocks will use the latest version of your starter from npm as the origin, and the current directory as the target.

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

## Usage

LockBlocks is a command line utility that takes two arguments: an origin directory, and a target directory. 

```shell
lockblocks origin target
```

Files, directories, and code blocks are transferred from the origin directory to the target directory as per the configuration and special tags found in the origin files.

The origin directory must contain a config file called `lockblocks.yml` for LockBlocks to run. See below for configuration options.

Pass the `--verbose` arg to print `info` and `action` type events. Pass `--silent` to silence all output.

### Config (lockblocks.yml)

You must create a config file in the root of the project called `lockblocks.yml`. This file must be present for LockBlocks to work.

Field specifications are as follows:

#### renameFiles

Specify files and directories to be renamed.

Specification:

```yaml
renameFiles: Reassignment[]
```

`Reassignment` is an object with the following fields:
- `from: string` - The previous file or directory name.
- `to: string` - The new file or directory name.

Example:

```yaml
renameFiles:
  - from: src/config.json
    to: src/settings.json
  - from: src/comps
    to: src/components
```

#### replaceFiles

Specify what files or directories to replace completely with the origin. The target file will be removed, then the origin file will be copied to the target.

Specification:

```yaml
replaceFiles: (string | OriginTarget)[]
```

You can specify an array of strings, which are filenames relative to the root, or a pair of from/to filenames if you'd like to rename the file during the operation. 

`OriginTarget` is an object with the following fields:
- `origin: string` - The filename in the origin project.
- `target: string` - The filename in the target project.

If specifying origin or target, both are required for a renaming to occur.

Example:

```yaml
replaceFiles:
  - core
  - .node-version
```

#### fillFiles

Specify files to copy to the target only if they don't already exist. If a directory is specified, missing files and directories will be copied recursively.

Specification: 

```yaml
fillFiles: (string | OriginTarget)[]
```

You can specify an array of strings, which are filenames relative to the root, or a pair of from/to filenames if you'd like to fill a different filename/dir during the operation. 

`OriginTarget` is an object with the following fields:
- `origin: string` - The filename in the origin project.
- `target: string` - The filename in the target project.

If specifying origin or target, both are required for a renaming to occur.

Example:

```yaml
fillFiles:
  - src/components
  - origin: defaults/settings/default.yml
    target: src/settings/settings.yml
```

#### deleteFiles

Specify files and directories to be deleted in the target.

Specification:

```yaml
deleteFiles: string[]
```

Example:

```yaml
deleteFiles:
  - media/icon-placeholder.png
  - src/components/LegacyWrapper.tsx
  - src/stuff
```
#### excludePaths

Specify the paths to exclude scanning for [lock tags](#lock-tags). Paths are relative to the origin directory (do not prefix paths with `./`). Can be directories or files.

Only UTF-8 files will be scanned for tags. These paths are only applicable to files scanned for tags.

Specification:

- `excludePaths: string[]`

Example:

```yaml
excludePaths:
  - .git
  - .lockblocks
  - node_modules
  - README.md
```

#### updateJson and updateYaml

Specify the fields to be updated in JSON and YAML files. 

This is useful for keeping fields (scripts, deps, etc) updated in `package.json`, or for updating fields in YAML files.

Specification:

For JSON files:

```yaml
updateJson: ConfigUpdate[]
```

For YAML files:

```yaml
updateYaml: ConfigUpdate[]
```

The value is an array of `ConfigUpdate`s. These define how a config file should be updated. A path to the file is required and LockBlocks expects the file to contain an object at the root. All other fields are optional. You can specify fields to be updated, deleted, and renamed. You can also specify the behavior for each update. See below for details.

`ConfigUpdate` is an object with the following fields:

- `path: string` - The path to the file to update
- `root: FieldUpdateOptions` - An object specifying how the fields should be updated. See below.
- `renameFields: Reassignment[]` - An array of from/to pairs for renaming fields.
- `updateFields: FieldUpdate[]` - An array of updates specs. See below.
- `deleteFields: string[]` - An array of field names. Supports dot notation for nested fields (e.g. my.field.name)

`FieldUpdateOptions` is an object with the following fields:
- `merge: boolean` - *Optional.* Copy all fields from origin to target, leaving all others.
- `fill: boolean` - *Optional.* Copy only missing fields from origin to target.
- `prune: boolean` - *Optional.* Remove all target fields missing from origin.
- `replace: boolean` - *Optional.* Copy all fields from origin to target, deleting all others. Same as merge + prune.

`FieldUpdate` is an object with the following fields:
- `key: string` - The key of the field to update. Supports dot notation for nested fields (e.g. my.field.name)
- `as: string` - *Optional.* When specified, this field name will be used in the target. Supports dot notation for nested fields (e.g. new.key.title).
- Any of the `FieldUpdateOptions` fields.

`Reassignment` is an object with the following fields:
- `from: string` - The previous field name.
- `to: string` - The new field name.

The `root` option will affect all fields at the root of the file. This expects a `FieldUpdateOptions` object (see above).

Order of updates:

- Apply root updates
- Rename fields
- Update fields
- Delete fields

Example:

```yaml
updateJson:
  - path: package.json
    root:
      fill: true
    renameFields:
      - from: oldName
        to: newName
    updateFields:
      - key: version
        as: starterVersion
      - key: scripts
        merge: true
      - key: dependencies
        merge: true
      - key: devDependencies
        merge: true
    deleteFields:
      - scripts.remove
updateYaml:
  - path: settings/settings.yml
    renameFields:
      - from: analyticsCode
        to: analyticsMeasurementId
      - from: site.header
        to: site.title
    updateFields:
      - key: defaults
        merge: true
    deleteFields:
      - theme
```

#### log

Specify a filename to save the update log to, or `false` to disable logging.

Specification:

```yaml
log: boolean | string
```

If log is not specified or set to `true`, logs will be saved to `lockblocks.log` by default. If set to `false`, no logs will be saved.

Examples:

```yaml
log: true # Logs are saved to lockblocks.log when true
```

```yaml
log: false # No logs will be saved
```

```yaml
log: updater.log # Logs are saved to this file
```

--- 

### Lock Tags

LockBlocks will scan the origin directory for special tags that allow you to transfer and rename files, and synchronize code blocks. 

These tags can be placed in comments. Only UTF-8 files will be scanned.

#### Replace File Tag

Use the `[lock-all/]` tag anywhere in a file to cause the entire file to be replaced in the target.

```ts
// [lock-all/]
```

#### Code Block Tags

Surround code with the `[lock:block]` and `[/lock:block]` tags to cause a block of code in the origin to be replaced in the target file of the same name.

The `block` part of this tag should be a unique ID that names that block in the file. This convention allows you to have multiple locked code blocks per file. 

The IDs need only be unique for each given file (you can use the same ID in multiple files).

```ts
// [lock:block]
// Code
// ...
// [/lock:block]

// ...

// [lock:another-block]
// More code
// ...
// [/lock:another-block]
```

#### Rename File Tags

Add the tag `[lock-rename: path/to/previous/filename.txt /]` to a file to rename the old filepath to the current one. LockBlocks will search the target for the old filepath and rename the file to the current filepath if the old file exists. Paths are relative to the root.

You can specify multiple rename tags in any given file.

```ts
// [lock-rename: path/to/previous/filename.txt /]
```

#### Ignore Tag

Add the `[lock-ignore/]` tag to tell LockBlocks to ignore the line and any other tags it may contain.

```ts
// [lock-all/] [lock-ignore/] 
```

#### Tag Ejection

In the target project, simply remove a tag from the file to prevent LockBlocks from making that update.

For instance, you can remove the `[lock:block] ... [/lock:block]` tags around a block of code to "eject" from the starter. That code block will no longer by updated.

---

## Logging

LockBlocks saves a log of the updates made to `lockblocks.log`, unless otherwise specified with the [`log`](#log) option.

## TypeScript

Type definitions have been included for [TypeScript](https://www.typescriptlang.org/) support.

## Contributing

Open source software is awesome and so are you. 😎

Feel free to submit a pull request for bugs or additions, and make sure to update tests as appropriate. If you find a mistake in the docs, send a PR! Even the smallest changes help.

For major changes, open an issue first to discuss what you'd like to change.

## ⭐ Found It Helpful? [Star It!](https://github.com/justinmahar/lockblocks/stargazers)

If you found this project helpful, let the community know by giving it a [star](https://github.com/justinmahar/lockblocks/stargazers): [👉⭐](https://github.com/justinmahar/lockblocks/stargazers)

## MIT License

```
Copyright © 2022 Justin Mahar https://github.com/justinmahar

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
