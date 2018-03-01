/**
 * @license
 * Copyright (c) 2015 Ninh Pham <ninhpham@hotmail.com>
 *
 * Use of this source code is governed by the MIT license.
 */

import { Expression, IProcessors } from "../dist/simex";
import { Expression } from "../src/Expression";
import { IProcessors } from "../src/Process";
import * as fs from "fs";

import { expect } from "chai";

// tslint:disable:mocha-no-side-effect-code

const processors: IProcessors = {
    float: (text: string, fixed?: string): string => {
        const v = parseFloat(text);
        if (isNaN(v)) {
            // tslint:disable-next-line:no-string-throw
            throw "Error";
        }
        else if (fixed !== undefined) {
            return v.toFixed(parseInt(fixed || "0", 10));
        }
        else {
            return v.toString();
        }
    },
    int: (text: string, radix?: string): string => {
        const v = parseInt(text, parseInt(radix || "10", 10));
        if (isNaN(v)) {
            throw new Error("invalid number");
        }
        else {
            return v.toString();
        }
    },
    notfuncion: ("notfunction" as any)
};

const  messages = {
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

// test data:
//    title
//    expression
//    input
//    output
//    error

describe("Simex", () => {

    function helpIt(json: any, filename: string) {
        if (typeof json == "object") {
            if (json instanceof Array) {
                for (const j of json) {
                    helpIt(j, filename)
                }
                return;
            }
        }
        else {
            throw new Error("Invalid Test Data " + filename);
        }

        const exptext = JSON.stringify(json.expression);

        // processors
        let p: IProcessors = undefined;
        if (json.processors) {
            p = {};
            for (const name of json.processors) {
                p[name] = processors[name]
            }
        }

        // error
        let error: string = undefined;
        if (json.error) {
            error = messages[json.error];
            if (!error) {
                throw Error("Invalid test Data.\nFile: " + filename + "\n" + json.error)
            }
            if (json.at) {
                error += "\n@ " + json.at;
            }
        }

        if (json.input) {
            if (error) {
                it("should fail with " + exptext + " from \"" + json.input + "\", throw $" + json.error, () => {
                    expect(() => new Expression(json.expression, p).extract(json.input)).throw(error);
                });
            }
            else {
                it("should extract with " + exptext + " from \"" + json.input + "\" to " + JSON.stringify(json.output), () => {
                    expect(new Expression(json.expression, p).extract(json.input)).deep.equal(json.output);
                });
            }
        }
        else if (error) {
            it("should fail with " + exptext+ ", and throw $" + json.error, () => {
                expect(() => new Expression(json.expression, p)).to.throw(error);
            });
        }
        else {
            it("should load with " + exptext, () => {
                expect(JSON.parse(JSON.stringify(new Expression(json.expression, p)))).deep.equal(json.expression);
            });
        }
    }

    ["syntax", "extraction"].forEach((section) => {
        describe("@" + section, () => {
            const dir = __dirname + "/data/" + section;
            const items = fs.readdirSync(dir);
            var groups: string[] = [];
            var files: string[] = [];
            for (const item of items) {
                if (!item.endsWith(".test.json")) {
                    continue
                }
                let group = item.substring(item.indexOf('.') + 1, item.length - ".test.json".length).trim();
                groups.push(group);
                files.push(item);
            }
            for (var i = 0; i < groups.length; i += 1) {
                describe(groups[i], () => {
                    let file = files[i];
                    const json = JSON.parse(fs.readFileSync(dir + "/" + file, "utf8"));
                    helpIt(json, file);
                });
            }
        });
    });
});