/**
 * @license
 * Copyright (c) 2015 Ninh Pham <ninhpham@hotmail.com>
 *
 * Use of this source code is governed by The MIT license.
 */

export /* internal */
class AtError extends Error {
    public at: string;

    public constructor(message: string, at: string) {
        super(message);
        if (at === "") {
            this.at = "";
        }
        else if (at.indexOf("@ ") == 0) {
            this.at = at;
        }
        else {
            this.at = "@ " + at;
        }
    }
}

export /* internal */
function addMessageAt(error: any) {
    if (typeof error.at === "string" && typeof error.message === "string") {
        if (error.at !== "") {
            error.message += "\n" + error.at;
        }
    }
}

export /* internal */ const messages = {
    array: "Property \"array\" must be an object.",
    backward: "Property \"backward\" must be boolean.",
    between: "Property \"between\" must be an object or an array of object.",
    by: "Property \"by\" must be a string.",
    byMissing: "Property \"by\" is missing.",
    dictionary: "Property \"dictionary\" must be an object.",
    expression: "Expression must be an object with the required property \"root\".",
    has: "Property \"has\" must be a string.",
    item: "Property \"item\" must be an object or a non-empty array of object and null.",
    member: "Member value of dictionary must be an object or a non-empty array of object and null.",
    omit: "Property \"omit\" must be true or false.",
    root: "Property \"root\" must be an object.",
    rootMissing: "Property \"root\" is missing.",
    prefix: "Property \"prefix\" must be either a string or an array of strings.",
    process: "Property \"process\" must be a string, an object, or an array of string and object.",
    processUndefined: "Function is not found in processors.",
    separator: "Property \"separator\" must be either a non-empty string or an array of non-empty strings.",
    separatorMissing: "Property \"separator\" is missing.",
    slice: "Property \"slice\" must be an object or an non-empty array of object.",
    subexpressions: "Only one of value, slice, array, and dictionary shall be defined.",
    suffix: "Property \"suffix\" must be either a string or an array of strings.",
    trim: "Property \"trim\" must be boolean.",
    inputUnmatched: "Provided input does not match the expression.",
    with: "Property \"with\" must be either a string or an array of strings."
};
