/**
 * Perform a deep comparison between two objects to determine if they are equivalent.
 * Based on this blog article: https://blog.jmorbegoso.com/post/check-objects-deep-equality-in-typescript/
 *
 * @param object1 object or array
 * @param object2 object or array
 * @param deepIncluded: when true, check only if properties of object1 are all included and equivalent as the ones in object2. This way, object1 can have less properties than object2
 */
function compareValues(value1: unknown, value2: unknown, deepIncluded?: boolean): boolean {
  if (isObject(value1) && isObject(value2)) {
    return deepEqual(value1 as object, value2 as object, deepIncluded);
  }
  // we consider undefined and null as equivalent
  if (value1 === undefined || value1 === null) {
    return value1 == value2;
  }
  return value1 === value2;
}

export function deepEqual(object1: object, object2: object, deepIncluded?: boolean): boolean {
  // For arrays, we check deep equality of each item
  if (Array.isArray(object1) && Array.isArray(object2)) {
    if (object1.length !== object2.length) return false;
    return object1.every((item, index) => compareValues(item, object2[index], deepIncluded));
  }

  // Get the objects keys
  const keys1 = Object.keys(object1);
  const keys2 = Object.keys(object2);

  if (deepIncluded ? keys1.length > keys2.length : keys1.length !== keys2.length) {
    return false;
  }

  // loop for-of: To loop through the values of an iterable object
  for (const key of keys1) {
    if (!compareValues((object1 as any)[key], (object2 as any)[key], deepIncluded)) {
      return false;
    }
  }

  return true;
}

/**
 * Perform a deep comparison between two objects to determine if all the properties of the first object are equivalent to the ones included on the second object (which may have more properties).
 * @param object1 object which should be fully included in the second one
 * @param object2 object which should include all the properties of the first one
 * @returns true if object1 is fully included in object2
 */
export function deepIncluded(object1: object, object2: object): boolean {
  // Get the objects keys
  const keys1 = Object.keys(object1);
  const keys2 = Object.keys(object2);

  // Compares if the number of keys of the objects is different
  if (keys1.length >= keys2.length) {
    return false;
  }

  // loop for-of: To loop through the values of an iterable object
  for (const key of keys1) {
    const value1 = (object1 as any)[key];
    const value2 = (object2 as any)[key];

    if (isObject(value1) && isObject(value2)) {
      // Both are objects, so compare them using deepEqual
      if (!deepEqual(value1, value2)) return false;
    } else if (Array.isArray(value1) && Array.isArray(value2)) {
      // Both are arrays, so compare length and each items using deepEqual
      if (value1.length === value2.length) {
        return value1.every((prop, index) => deepEqual(prop, value2[index]));
      } else {
        return false;
      }
    // Both aren't objects nor array, so compare them using equality operator
    } else if (value1 !== value2) return false;
  }

  return true;
}

// Helper function to check if the parameter is an object
export function isObject(object: unknown): boolean {
  return object != null && typeof object === 'object';
}
export function isArray(object: unknown): boolean {
  return object != null && Array.isArray(object);
}
