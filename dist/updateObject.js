"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateObject = void 0;
var updateObject = function (originObj, targetObj, rootUpdateOptions, renameFields, updateFields, deleteFields) {
    // Update the root
    applyFieldOptions(originObj, targetObj, rootUpdateOptions);
    // Rename fields specified
    renameFields.forEach(function (assignment) {
        if (assignment.from && assignment.to) {
            renameField(targetObj, assignment.from, assignment.to);
        }
    });
    // Update fields specified
    updateFields.forEach(function (fieldUpdate) {
        if (fieldUpdate.key) {
            var originKey = fieldUpdate.key, as = fieldUpdate.as, fieldUpdateOptions = __rest(fieldUpdate, ["key", "as"]);
            var targetKey = as ? as : originKey;
            updateField(originObj, targetObj, originKey, targetKey, fieldUpdateOptions || {});
        }
    });
    // Delete fields specified
    deleteFields.forEach(function (fieldToDelete) {
        deleteField(targetObj, fieldToDelete);
    });
    return targetObj;
};
exports.updateObject = updateObject;
var applyFieldOptions = function (originObj, targetObj, options) {
    if (options === void 0) { options = {}; }
    var originObjKeys = Object.keys(originObj);
    var targetObjKeys = Object.keys(targetObj);
    if (options.merge || options.replace) {
        originObjKeys.forEach(function (key) {
            targetObj[key] = originObj[key];
        });
    }
    if (options.fill) {
        originObjKeys.forEach(function (key) {
            if (!targetObjKeys.includes(key)) {
                targetObj[key] = originObj[key];
            }
        });
    }
    if (options.prune || options.replace) {
        targetObjKeys.forEach(function (key) {
            if (!originObjKeys.includes(key)) {
                delete targetObj[key];
            }
        });
    }
};
var renameField = function (targetObj, oldName, newName) {
    var oldFieldHierarchy = oldName.split('.');
    var newFieldHierarchy = newName.split('.');
    var oldFieldExists = false;
    var oldValueParent = targetObj;
    var oldValue = undefined;
    // Establish that the old field exists, and get its value
    for (var i = 0; i < oldFieldHierarchy.length; i++) {
        var isLast = i === oldFieldHierarchy.length - 1;
        var currField = oldFieldHierarchy[i];
        if (!isLast) {
            if (typeof oldValueParent[currField] === 'object') {
                oldValueParent = oldValueParent[currField];
            }
            else {
                // console.warn("Field can't be accessed to rename:", oldName, `(${currField} is not an object)`);
                break;
            }
        }
        else {
            if (Object.keys(oldValueParent).includes(currField)) {
                oldFieldExists = true;
                oldValue = oldValueParent[currField];
                delete oldValueParent[currField];
            }
            else {
                // console.warn("Field can't be accessed to rename:", oldName, `(doesn't exist)`);
                break;
            }
        }
    }
    if (oldFieldExists) {
        var targetValueParent = targetObj;
        for (var i = 0; i < newFieldHierarchy.length; i++) {
            var isLast = i === newFieldHierarchy.length - 1;
            var currField = newFieldHierarchy[i];
            if (!isLast) {
                if (typeof targetValueParent[currField] === 'undefined') {
                    targetValueParent[currField] = {};
                    targetValueParent = targetValueParent[currField];
                }
                else if (typeof targetValueParent[currField] === 'object') {
                    targetValueParent = targetValueParent[currField];
                }
                else {
                    var obsoleteValue = targetValueParent[currField];
                    targetValueParent["__obsolete__".concat(currField)] = obsoleteValue;
                    targetValueParent[currField] = {};
                    targetValueParent = targetValueParent[currField];
                }
            }
            else {
                // console.log('Renaming', oldName, 'to', newName);
                targetValueParent[currField] = oldValue;
            }
        }
    }
};
var updateField = function (originObj, targetObj, originFieldName, targetFieldName, options) {
    if (options === void 0) { options = {}; }
    var originFieldHierarchy = originFieldName.split('.');
    var originFieldExists = false;
    var originValueParent = originObj;
    var originValue = undefined;
    // Establish that the field exists in the origin, and get its value
    for (var i = 0; i < originFieldHierarchy.length; i++) {
        var isLast = i === originFieldHierarchy.length - 1;
        var currField = originFieldHierarchy[i];
        if (!isLast) {
            if (typeof originValueParent[currField] === 'object') {
                originValueParent = originValueParent[currField];
            }
            else {
                // console.error("Field can't be accessed:", originFieldName, `(${currField} is not an object)`);
                break;
            }
        }
        else {
            if (Object.keys(originValueParent).includes(currField)) {
                originFieldExists = true;
                originValue = originValueParent[currField];
            }
            else {
                // console.error("Field can't be accessed:", originFieldName, `(doesn't exist)`);
                break;
            }
        }
    }
    var targetFieldHierarchy = targetFieldName.split('.');
    if (originFieldExists) {
        var targetValueParent = targetObj;
        for (var i = 0; i < targetFieldHierarchy.length; i++) {
            var isLast = i === targetFieldHierarchy.length - 1;
            var currField = targetFieldHierarchy[i];
            if (!isLast) {
                if (typeof targetValueParent[currField] === 'undefined') {
                    targetValueParent[currField] = {};
                    targetValueParent = targetValueParent[currField];
                }
                else if (typeof targetValueParent[currField] === 'object') {
                    targetValueParent = targetValueParent[currField];
                }
                else {
                    var obsoleteValue = targetValueParent[currField];
                    targetValueParent["__obsolete__".concat(currField)] = obsoleteValue;
                    targetValueParent[currField] = {};
                    targetValueParent = targetValueParent[currField];
                }
            }
            else {
                if (typeof originValue === 'object' && typeof targetValueParent[currField] === 'object') {
                    // console.log('Applying field options for:', originFieldName, `(${currField})`);
                    applyFieldOptions(originValue, targetValueParent[currField], options);
                }
                else {
                    targetValueParent[currField] = originValue;
                }
            }
        }
    }
};
var deleteField = function (targetObj, fieldName) {
    var fieldHierarchy = fieldName.split('.');
    var targetValueParent = targetObj;
    for (var i = 0; i < fieldHierarchy.length; i++) {
        var isLast = i === fieldHierarchy.length - 1;
        var currField = fieldHierarchy[i];
        if (!isLast) {
            if (typeof targetObj[currField] === 'object') {
                targetValueParent = targetValueParent[currField];
            }
            else {
                // console.warn(
                //   "Field can't be deleted:",
                //   fieldName,
                //   `(${currField} is not an object) -- HIDE THIS WARNING ONCE WORKING`,
                // );
                break;
            }
        }
        else {
            if (Object.keys(targetValueParent).includes(currField)) {
                delete targetValueParent[currField];
            }
            else {
                // console.warn("Field can't be deleted:", fieldName, `(doesn't exist) -- HIDE THIS WARNING ONCE WORKING`);
                break;
            }
        }
    }
};
