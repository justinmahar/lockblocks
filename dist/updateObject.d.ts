import { FieldUpdate, FieldUpdateOptions, Reassignment } from './LockblocksSettings';
export declare const updateObject: (originObj: Record<string, any>, targetObj: Record<string, any>, rootUpdateOptions: FieldUpdateOptions, renameFields: Reassignment[], updateFields: FieldUpdate[], deleteFields: string[]) => Record<string, any>;
