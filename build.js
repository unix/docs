const fs = require('fs-extra')
const { join } = require('path')

const getDirPath = name => join(__dirname, name)
const getCatalogFilePath = () => join(__dirname, '_catalog.json')
const getSubcatalogFilePath = name => join(__dirname, name, '_catalog.json')

let modulesCache = []
const getModules = async () => {
  if (modulesCache.length) return modulesCache
  const names = await fs.readdir(__dirname)
  modulesCache = names.filter(name => {
    if (name.startsWith('.') || name === 'node_modules') return false
    return fs.statSync(getDirPath(name)).isDirectory()
  })
  return modulesCache
}

const makeCatalog = async () => {
  const dirs = await getModules()
  const catalog = {
    modules: dirs,
  }
  await fs.writeJSON(getCatalogFilePath(), catalog, { spaces: 2 })
}

const makeSubcatalog = async () => {
  const names = await getModules()
  await Promise.all(names.map(async name => {
    const subPath = getDirPath(name)
    const files = await fs.readdir(subPath)
    const docFiles = files
      .filter(item => item.endsWith('.json') && item !== '_catalog.json')
      .map(item => item.replace('.json', ''))
    const catalog = {
      files: docFiles,
    }
    await fs.writeJSON(getSubcatalogFilePath(name), catalog, { spaces: 2 })
  }))
}

;(async () => {
  await makeCatalog()
  await makeSubcatalog()
})()

