const packagesDir = './assets/pkg'

// let packageNamesCache
// export function packageNames () {
//   if (!packageNamesCache) {
//     packageNamesCache = require('fs').readdirSync(packagesDir)
//       .filter(s => !s.includes('.'))
//   }
//   return packageNamesCache
// }

let packagesCache
export function allPackages () {
  if (!packagesCache) {
    const assets = require('glob').sync('**', { cwd: 'assets', nodir: true })
    packagesCache = assets
      .filter(a => a.endsWith('/package.json'))
      .map(path => read(`assets/${path}`))
  }
  return packagesCache
}

export function errors () {
  const semver = require('semver')
  const allErrors = []

  const assets = require('glob').sync('**', { cwd: 'assets', nodir: true })
  assets
    .filter(a => a.endsWith('/package.json'))
    .forEach(path => {
      if (!path.startsWith('pkg/')) {
        return err('Unexpected package.json file')
      }
      const pathInfo = path.slice(4, -13)
      if (!pathInfo.includes('/')) {
        return err('Path must have this format: pkg/<package-name>/<version>/')
      }

      // Parse path to package
      const split = pathInfo.lastIndexOf('/')
      const name = pathInfo.slice(0, split)
      const version = pathInfo.slice(split + 1)
      if (!semver.valid(version)) {
        err('Invalid version in path')
      }

      // Parse package.json
      const json = read(`assets/${path}`)
      if (!json.name) {
        err('`name` is required in package.json')
      }
      if (!json.version) {
        err('`version` is required in package.json')
      } else if (!semver.valid(json.version)) {
        err('Invalid version in package.json')
      }
      if (!json.license) {
        err('`license` is required in package.json')
      }
      if (!json.description) {
        err('`description` is required in package.json')
      }

      // Compare path json and json
      if (json.name !== name) {
        err('Conflicting `name` in path vs package.json')
      }
      if (json.version !== version) {
        err('Conflicting `name` in path vs package.json')
      }

      function err (msg) {
        allErrors.push({ name, version, msg, path })
      }
    })

  return allErrors
}

function read (path) {
  try {
    const data = require('fs').readFileSync(path, 'utf8')
    return JSON.parse(data)
  } catch (e) {
    console.log(e.message)
  }
}
