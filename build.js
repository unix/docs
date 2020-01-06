const fs = require('fs-extra')
const hash = require('shorthash')
const { join } = require('path')
const ignoreNames = ['node_modules', 'dist', '.github', '.git']
const destPath = join(__dirname, 'dist')

const getDirPath = name => join(__dirname, name)
const removeSuffix = name => name.split('.')[0]

const getDirs = async () => {
  const names = await fs.readdir(__dirname)
  return names.filter(name => {
    if (name.startsWith('.') || ignoreNames.includes(name)) return false
    return fs.statSync(getDirPath(name)).isDirectory()
  })
}

const getModules = async () => {
  const dirs = await getDirs()
  
  return dirs.reduce((pre, current) => {
    const dirName = join(__dirname, current)
    const files = fs.readdirSync(dirName)
    if (!files || !Array.isArray(files)) return pre
    
    const safeFiles = files.filter(name => !name.startsWith('_'))
    const fragments = safeFiles.map(name => ({ name: removeSuffix(name), type: current }))
    return pre.concat(fragments)
  }, [])
}

const getHashes = async () => {
  const dirs = await getDirs()
  
  return dirs.reduce((pre, current) => {
    const dirName = join(__dirname, current)
    const files = fs.readdirSync(dirName) || []
    
    const hashes = files.reduce((pre, current) => {
      const content = fs.readJSONSync(join(dirName, current)) || {}
      const contentHashes = Object.keys(content).map(key => {
        return {
          h: hash.unique(content[key]),
          v: content[key],
        }
      })
      return pre.concat(contentHashes)
    }, [])
    
    return pre.concat(hashes)
  }, [])
}

const sortByLength = hashes => {
  const file = {}
  
  hashes.forEach(hash => {
    const num = hash.h.length
    if (!file[num]) file[num] = []
  
    file[num].push(hash)
  })
  return file
}

;(async() => {
  const docModules = await getModules()
  const catalog = {
    modules: docModules,
  }
  
  await fs.remove(destPath)
  await fs.ensureDir(destPath)
  await fs.writeJSON(join(destPath, '_catalog.json'), catalog)
  
  const hashes = await getHashes()
  const sortedHashes = sortByLength(hashes)
  const hashDir = join(destPath, 'hashes')
  await fs.ensureDir(hashDir)
  
  Object.keys(sortedHashes).forEach(key => {
    fs.writeJSONSync(join(hashDir, `${key}.json`), sortedHashes[key])
  })
})()
