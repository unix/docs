const { readdirSync, writeFileSync, statSync } = require('fs')
const { join } = require('path')

const getDirPath = name => join(__dirname, name)
const getCatalogPath = () => join(__dirname, 'catalog.json')

const names = readdirSync(__dirname)
const dirs = names.filter(name => {
  if (name.startsWith('.')) return false
  return statSync(getDirPath(name)).isDirectory()
})

const catalog = {
  modules: dirs,
}

const catalogStr = JSON.stringify(catalog, null, 2)
writeFileSync(getCatalogPath(), catalogStr)
