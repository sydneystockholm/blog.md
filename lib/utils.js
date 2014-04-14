var utils = exports;

/**
 * Copy an object.
 *
 * @param {Object} obj
 * @return {Object} copy
 */

utils.copy = function (obj) {
    if (Array.isArray(obj)) {
        return obj.map(function (elem) {
            return utils.copy(elem);
        });
    } else if (typeof obj === 'obj') {
        var copy = {};
        for (var i in obj) {
            copy[i] = utils.copy(obj[i]);
        }
    } else {
        copy = obj;
    }
    return copy;
};

/**
 * Create a set from an array where elements are stored as object keys.
 *
 * @param {Array} arr
 * @return {Object} set
 * @api public
 */

utils.createSet = function createSet(arr) {
    var obj = {};
    arr.forEach(function (elem) {
        obj[elem] = 1;
    });
    return obj;
};
