/**
 * @license
 * Copyright (c) 2015 Ninh Pham <ninhpham@hotmail.com>
 *
 * Use of this source code is governed by The MIT license.
 */

import { /* internal */ AtError, messages } from "./AtError";

/**
 * Holds all collection of user-defined processors.
 * @export
 * @interface IProcessors
 */
export /* external */
interface IProcessors {
    [name: string]: (input: string, args?: string[]) => string;
}

export /* internal */
class Process {
    private readonly path: string;

    private by: string;
    private with?: string[];
    private func: (input: string, arg?: string[]) => string;

    private processIsObject: boolean;
    private withIsArray: boolean;

    constructor(path: string, json: any, processors: IProcessors) {
        this.path = path;

        if (typeof json === "string") {
            this.processIsObject = false;
            this.by = json
        }
        else if (typeof json === "object" && !(json instanceof Array || json === null)) {
            this.processIsObject = true;

            // Gets the required `by`.
            if (json.hasOwnProperty("by")) {
                if (typeof json.by !== "string") {
                    throw new AtError(messages.by, this.path + ".by");
                }
                this.by = json.by;
            }
            else {
                throw new AtError(messages.byMissing, this.path);
            }

            // Gets the optional `with`.
            if (json.hasOwnProperty("with")) {
                this.withIsArray = json.with instanceof Array;
                let array: any[] = this.withIsArray ? json.with : [json.with];
                this.with = array.map((item, index) => {
                    if (typeof(item) == "string") {
                        return item;
                    }
                    else {
                        throw new AtError(messages.with, this.path + ".with" + (this.withIsArray ? `[${index}]` : ""));
                    }
                });
            }
        }
        else {
            throw new AtError(messages.process, this.path);
        }

        this.func = processors[this.by];
        if (!this.func) {
            this.func = defaultProcessors[this.by]
            if (!this.func) {
                throw new AtError(messages.processUndefined, this.path + (this.processIsObject ? ".by" : ""));
            }
        }
    }

    public extract(input: string): any {
        try {
            return this.func(input, this.with);
        }
        catch (e) {
            const error = new AtError(messages.inputUnmatched, this.path);
            if (e.stack) {
                error.stack = e.stack;
            }
            throw error;
        }
    }

    public toJSON(): any {
        if (this.processIsObject) {
            let json: any = { by: this.by };
            if (this.with) {
                json.with = this.withIsArray ? this.with : this.with[0];
            }
            return json
        }
        else {
            return this.by;
        }
    }
}

const defaultProcessors: IProcessors = {
    "append": function (input: string, args?: string[]): string {
        return args ? (input + args.join('')) : input
    },
    "prepend": function (input: string, args?: string[]): string {
        return args ? (args.join('') + input) : input
    },
    "replace": function (input: string, args?: string[]): string {
        if (args) {
            for (var i = 0; i + 1 < args.length; i += 2) {
                input = input.split(args[i]).join(args[i + 1])
            }
        }
        return input
    },
    "replaceTo": function (input: string, args?: string[]): string {
        if (args && args.length == 2) {
            return args[0].split(args[1]).join(input)
        }
        return input
    },
    "unescape": function (input: string, args?: string[]): string {
        if (args) {
            for (let arg of args) {
                switch (arg) {
                case 'xml':
                    // courtesy to Dulin Marat, https://github.com/mdevils/node-html-entities
                    input = input.replace(xmlRegex, function(s: string) {
                        if (s.charAt(1) === '#') {
                            var code = s.charAt(2).toLowerCase() === 'x' ?
                                parseInt(s.substr(3), 16) :
                                parseInt(s.substr(2));

                            if (isNaN(code) || code < -32768 || code > 65535) {
                                return s;
                            }
                            return String.fromCharCode(code);
                        }
                        return xmlMap[s] || s;
                    });
                    break;
                case 'js':
                    // courtesy to Ivan Akulov, https://github.com/iamakulov/unescape-js
                    input = input.replace(jsRegex, (substr, __, varHex, longHex, shortHex, octal, specialCharacter, python) => {
                        if (varHex !== undefined) {
                            let code = parseInt(varHex, 16);
                            return (isNaN(code) || code > 0xFFFF) ? substr : String.fromCharCode(code);
                        }
                        else if (longHex !== undefined) {
                            let code = parseInt(longHex, 16);
                            return String.fromCharCode(code);
                        }
                        else if (shortHex !== undefined) {
                            let code = parseInt(shortHex, 16);
                            return String.fromCharCode(code);
                        }
                        else if (octal !== undefined) {
                            let code = parseInt(octal, 8)
                            return String.fromCharCode(code);
                        }
                        else {
                            return jsMap[specialCharacter];
                        }
                    });
                    break;
                }
            }
        }
        return input;
    }
}

const xmlRegex = /&#?[0-9a-zA-Z]+;?/g;
const xmlMap: { [name: string]: string } = {
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": "\"",
    "&apos;": "'",
    "&amp;": "&"
};

const jsRegex = /\\(u\{([0-9A-Fa-f]+)\}|u([0-9A-Fa-f]{4})|x([0-9A-Fa-f]{2})|([1-7][0-7]{0,2}|[0-7]{2,3})|(['"tbrnfv0\\]))/g;
const jsMap: { [name: string]: string } = {
    "0": "\0",
    "b": "\b",
    "f": "\f",
    "n": "\n",
    "r": "\r",
    "t": "\t",
    "v": "\v",
    "'": "'",
    "\"": "\"",
    "\\": "\\"
};
