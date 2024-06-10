/**
 * Perform a deep comparison between two objects to determine if they are equivalent.
 * Based on this blog article: https://blog.jmorbegoso.com/post/check-objects-deep-equality-in-typescript/
 *
 * @param object1
 * @param object2
 */
export function deepEqual(object1: object, object2: object): boolean {
  // Get the objects keys
  const keys1 = Object.keys(object1);
  const keys2 = Object.keys(object2);

  // Compares if the number of keys of the objects is different
  if (keys1.length !== keys2.length) {
    return false;
  }

  // loop for-of: To loop through the values of an iterable object
  for (const key of keys1) {
    const value1 = (object1 as any)[key];
    const value2 = (object2 as any)[key];

    if (isObject(value1) && isObject(value2)) {
      // Both are objects, so compare them using deepEqual
      if (!deepEqual(value1, value2)) return false;
    } else {
      // Both aren't objects, so compare them using equality operator
      if (value1 !== value2) return false;
    }
  }

  return true;
}

// Helper function to check if the parameter is an object
export function isObject(object: unknown): boolean {
  return object != null && typeof object === 'object';
}
