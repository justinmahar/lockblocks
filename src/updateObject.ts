import { FieldUpdate, FieldUpdateOptions, Reassignment } from './LockblocksSettings';

export const updateObject = (
  originObj: Record<string, any>,
  targetObj: Record<string, any>,
  rootUpdateOptions: FieldUpdateOptions,
  renameFields: Reassignment[],
  updateFields: FieldUpdate[],
  deleteFields: string[],
): Record<string, any> => {
  // Update the root
  applyFieldOptions(originObj, targetObj, rootUpdateOptions);
  // Rename fields specified
  renameFields.forEach((assignment) => {
    if (assignment.from && assignment.to) {
      renameField(targetObj, assignment.from, assignment.to);
    }
  });
  // Update fields specified
  updateFields.forEach((fieldUpdate) => {
    if (fieldUpdate.key) {
      const { key: originKey, as, ...fieldUpdateOptions } = fieldUpdate;
      const targetKey = as ? as : originKey;
      updateField(originObj, targetObj, originKey, targetKey, fieldUpdateOptions || {});
    }
  });
  // Delete fields specified
  deleteFields.forEach((fieldToDelete) => {
    deleteField(targetObj, fieldToDelete);
  });

  return targetObj;
};

const applyFieldOptions = (
  originObj: Record<string, any>,
  targetObj: Record<string, any>,
  options: FieldUpdateOptions = {},
) => {
  const originObjKeys = Object.keys(originObj);
  const targetObjKeys = Object.keys(targetObj);
  if (options.merge || options.replace) {
    originObjKeys.forEach((key) => {
      targetObj[key] = originObj[key];
    });
  }
  if (options.fill) {
    originObjKeys.forEach((key) => {
      if (!targetObjKeys.includes(key)) {
        targetObj[key] = originObj[key];
      }
    });
  }
  if (options.prune || options.replace) {
    targetObjKeys.forEach((key) => {
      if (!originObjKeys.includes(key)) {
        delete targetObj[key];
      }
    });
  }
};

const renameField = (targetObj: Record<string, any>, oldName: string, newName: string): void => {
  const oldFieldHierarchy = oldName.split('.');
  const newFieldHierarchy = newName.split('.');
  let oldFieldExists = false;
  let oldValueParent = targetObj;
  let oldValue: any = undefined;
  // Establish that the old field exists, and get its value
  for (let i = 0; i < oldFieldHierarchy.length; i++) {
    const isLast = i === oldFieldHierarchy.length - 1;
    const currField = oldFieldHierarchy[i];
    if (!isLast) {
      if (typeof oldValueParent[currField] === 'object') {
        oldValueParent = oldValueParent[currField];
      } else {
        // console.warn("Field can't be accessed to rename:", oldName, `(${currField} is not an object)`);
        break;
      }
    } else {
      if (Object.keys(oldValueParent).includes(currField)) {
        oldFieldExists = true;
        oldValue = oldValueParent[currField];
        delete oldValueParent[currField];
      } else {
        // console.warn("Field can't be accessed to rename:", oldName, `(doesn't exist)`);
        break;
      }
    }
  }

  if (oldFieldExists) {
    let targetValueParent = targetObj;
    for (let i = 0; i < newFieldHierarchy.length; i++) {
      const isLast = i === newFieldHierarchy.length - 1;
      const currField = newFieldHierarchy[i];
      if (!isLast) {
        if (typeof targetValueParent[currField] === 'undefined') {
          targetValueParent[currField] = {};
          targetValueParent = targetValueParent[currField];
        } else if (typeof targetValueParent[currField] === 'object') {
          targetValueParent = targetValueParent[currField];
        } else {
          const obsoleteValue = targetValueParent[currField];
          targetValueParent[`__obsolete__${currField}`] = obsoleteValue;
          targetValueParent[currField] = {};
          targetValueParent = targetValueParent[currField];
        }
      } else {
        // console.log('Renaming', oldName, 'to', newName);
        targetValueParent[currField] = oldValue;
      }
    }
  }
};

const updateField = (
  originObj: Record<string, any>,
  targetObj: Record<string, any>,
  originFieldName: string,
  targetFieldName: string,
  options: FieldUpdateOptions = {},
): void => {
  const originFieldHierarchy = originFieldName.split('.');
  let originFieldExists = false;
  let originValueParent = originObj;
  let originValue: any = undefined;
  // Establish that the field exists in the origin, and get its value
  for (let i = 0; i < originFieldHierarchy.length; i++) {
    const isLast = i === originFieldHierarchy.length - 1;
    const currField = originFieldHierarchy[i];
    if (!isLast) {
      if (typeof originValueParent[currField] === 'object') {
        originValueParent = originValueParent[currField];
      } else {
        // console.error("Field can't be accessed:", originFieldName, `(${currField} is not an object)`);
        break;
      }
    } else {
      if (Object.keys(originValueParent).includes(currField)) {
        originFieldExists = true;
        originValue = originValueParent[currField];
      } else {
        // console.error("Field can't be accessed:", originFieldName, `(doesn't exist)`);
        break;
      }
    }
  }

  const targetFieldHierarchy = targetFieldName.split('.');
  if (originFieldExists) {
    let targetValueParent = targetObj;
    for (let i = 0; i < targetFieldHierarchy.length; i++) {
      const isLast = i === targetFieldHierarchy.length - 1;
      const currField = targetFieldHierarchy[i];
      if (!isLast) {
        if (typeof targetValueParent[currField] === 'undefined') {
          targetValueParent[currField] = {};
          targetValueParent = targetValueParent[currField];
        } else if (typeof targetValueParent[currField] === 'object') {
          targetValueParent = targetValueParent[currField];
        } else {
          const obsoleteValue = targetValueParent[currField];
          targetValueParent[`__obsolete__${currField}`] = obsoleteValue;
          targetValueParent[currField] = {};
          targetValueParent = targetValueParent[currField];
        }
      } else {
        if (typeof originValue === 'object' && typeof targetValueParent[currField] === 'object') {
          // console.log('Applying field options for:', originFieldName, `(${currField})`);
          applyFieldOptions(originValue, targetValueParent[currField], options);
        } else {
          targetValueParent[currField] = originValue;
        }
      }
    }
  }
};

const deleteField = (targetObj: Record<string, any>, fieldName: string): void => {
  const fieldHierarchy = fieldName.split('.');
  let targetValueParent = targetObj;
  for (let i = 0; i < fieldHierarchy.length; i++) {
    const isLast = i === fieldHierarchy.length - 1;
    const currField = fieldHierarchy[i];
    if (!isLast) {
      if (typeof targetObj[currField] === 'object') {
        targetValueParent = targetValueParent[currField];
      } else {
        // console.warn(
        //   "Field can't be deleted:",
        //   fieldName,
        //   `(${currField} is not an object) -- HIDE THIS WARNING ONCE WORKING`,
        // );
        break;
      }
    } else {
      if (Object.keys(targetValueParent).includes(currField)) {
        delete targetValueParent[currField];
      } else {
        // console.warn("Field can't be deleted:", fieldName, `(doesn't exist) -- HIDE THIS WARNING ONCE WORKING`);
        break;
      }
    }
  }
};
