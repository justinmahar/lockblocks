export interface LockblocksSettings {
    version?: number;
    log?: string | boolean;
    updateJson?: ConfigUpdate[];
    updateYaml?: ConfigUpdate[];
    excludePaths?: string[];
    replaceFiles?: (string | OriginTarget)[];
    fillFiles?: (string | OriginTarget)[];
    renameFiles?: Reassignment[];
    deleteFiles?: string[];
}
interface ConfigUpdate {
    path?: string;
    root: FieldUpdateOptions;
    updateFields?: FieldUpdate[];
    deleteFields?: string[];
    renameFields?: Reassignment[];
}
export declare type FieldUpdate = {
    key?: string;
    as?: string;
} & FieldUpdateOptions;
export declare type FieldUpdateOptions = {
    /** Copy all fields from origin to target, leaving all others. */
    merge?: boolean;
    /** Copy only missing fields from origin to target. */
    fill?: boolean;
    /** Remove all target fields missing from origin. */
    prune?: boolean;
    /** Copy all fields from origin to target, deleting all others. Same as merge + prune. */
    replace?: boolean;
};
export declare type Reassignment = {
    from?: string;
    to?: string;
};
export declare type OriginTarget = {
    origin?: string;
    target?: string;
};
export {};
