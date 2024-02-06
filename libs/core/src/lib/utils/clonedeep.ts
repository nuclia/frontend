// es-linter-disable-next-line
export const cloneDeep = (entity: any, cache = new WeakMap()): any => {
  const referenceTypes = ['Array', 'Object', 'Map', 'Set', 'Date'];
  const entityType = Object.prototype.toString.call(entity);
  if (!new RegExp(referenceTypes.join('|')).test(entityType) || entity instanceof WeakMap || entity instanceof WeakSet)
    return entity;
  if (cache.has(entity)) {
    return cache.get(entity);
  }
  const c = new entity.constructor();

  if (entity instanceof Map) {
    entity.forEach((value, key) => c.set(cloneDeep(key), cloneDeep(value)));
  }
  if (entity instanceof Set) {
    entity.forEach((value) => c.add(cloneDeep(value)));
  }
  if (entity instanceof Date) {
    return new Date(entity);
  }
  cache.set(entity, c);
  return Object.assign(c, ...Object.keys(entity).map((prop) => ({ [prop]: cloneDeep(entity[prop], cache) })));
};
