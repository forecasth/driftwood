const modules = import.meta.glob('./*.arrangement.js', { eager: true })
const registry = Object.values(modules).reduce((collection, module) => {
  const arrangement =
    module.default ??
    module.arrangement ??
    Object.values(module).find((entry) => entry?.id)

  if (arrangement?.id) {
    collection[arrangement.id] = arrangement
  }

  return collection
}, {})

const fallbackId = Object.keys(registry)[0]
export const defaultArrangementId = registry.duskArpeggio
  ? 'duskArpeggio'
  : fallbackId

export function getArrangement(id = defaultArrangementId) {
  return registry[id] ?? registry[defaultArrangementId] ?? null
}

export function listArrangements() {
  return Object.keys(registry)
}
