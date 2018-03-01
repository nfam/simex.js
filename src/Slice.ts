/**
 * @license
 * Copyright (c) 2015 Ninh Pham <ninhpham@hotmail.com>
 *
 * Use of this source code is governed by The MIT license.
 */

import { /* internal */ ArrayExp } from "./ArrayExp";
import { /* internal */ AtError, messages } from "./AtError";
import { /* internal */ Between } from "./Between";
import { /* internal */ Dictionary } from "./Dictionary";
import { /* internal */ IProcessors, Process } from "./Process";

export /* internal */
class Slice {
    private readonly path: string;

    private readonly has?: string;
    private readonly between?: Between[];
    private readonly process?: Process[];
    private readonly value?: any;
    private readonly slice?: Slice[];
    private readonly array?: ArrayExp;
    private readonly dictionary?: Dictionary;

    private readonly betweenIsArray: boolean;
    private readonly processIsArray: boolean;
    private readonly sliceIsArray: boolean;

    constructor(path: string, json: any, processors: IProcessors, typeError: string) {
        this.path = path;

        // The container must be a dictionary.
        if (typeof json !== "object" || json instanceof Array || json === null) {
            throw new AtError(typeError, this.path);
        }

        // Gets the optional `has`.
        if (json.hasOwnProperty("has")) {
            if (typeof json.has !== "string") {
                throw new AtError(messages.has, this.path + ".has");
            }
            this.has = json.has;
        }

        // Gets the optional `between`.
        if (json.hasOwnProperty("between")) {
            this.betweenIsArray = json.between instanceof Array
            let array: any[] = this.betweenIsArray ? json.between : [json.between];
            this.between = array.map((item, index) => {
                let location = this.path + ".between" + (this.betweenIsArray ? `[${index}]` : "");
                return new Between(location, item);
            });
        }

        if (json.hasOwnProperty("process")) {
            this.processIsArray = json.process instanceof Array
            let array: any[] = this.processIsArray ? json.process : [json.process];
            this.process = array.map((item, index) => {
                let location = this.path + ".process" + (this.processIsArray ? `[${index}]` : "");
                return new Process(location, item, processors);
            });
        }

        if (json.hasOwnProperty("value")) {
            if (json.hasOwnProperty("slice") || json.hasOwnProperty("array") || json.hasOwnProperty("dictionary")) {
                throw new AtError(messages.subexpressions, this.path);
            }
            this.value = json.value;
        }
        else if (json.hasOwnProperty("slice")) {
            if (json.hasOwnProperty("array") || json.hasOwnProperty("dictionary")) {
                throw new AtError(messages.subexpressions, this.path);
            }
            this.sliceIsArray = json.slice instanceof Array
            let array: any[] = this.sliceIsArray ? json.slice : [json.slice];
            this.slice = array.map((item, index) => {
                let location = this.path + ".slice" + (this.sliceIsArray ? `[${index}]` : "");
                return new Slice(location, item, processors, messages.slice)
            });
            if (this.slice.length == 0) {
                throw new AtError(messages.slice, this.path + ".slice");
            }
        }
        else if (json.hasOwnProperty("array")) {
            if (json.hasOwnProperty("dictionary")) {
                throw new AtError(messages.subexpressions, this.path);
            }
            this.array = new ArrayExp(this.path + ".array", json.array, processors)

        }
        else if (json.hasOwnProperty("dictionary")) {
            this.dictionary = new Dictionary(this.path + ".dictionary", json.dictionary, processors)
        }
    }

    public extract(input: string): any {
        if (this.has && this.has.length > 0) {
            if (input.indexOf(this.has) < 0) {
                throw new AtError(messages.inputUnmatched, this.path + ".has");
            }
        }

        let str = input
        if (this.between) {
            for (const item of this.between) {
                str = item.extract(str);
            }
        }

        if (this.process) {
            for (const item of this.process) {
                str = item.extract(str);
            }
        }

        if (this.value !== undefined) {
            return this.value;
        }
        else if (this.slice) {
            let errors: AtError[] = [];
            for (let index = 0; index < this.slice.length; index += 1) {
                let slice = this.slice[index];
                try {
                    return slice.extract(str);
                }
                catch (error) {
                    errors.push(error);
                }
            }

            // Should have errors since this.slice is not empty.
            // Don't check errors.length, to let it throw exception,
            // if there are mistakes in code.
            if (this.sliceIsArray) {
                let location = errors.map(error => error.at).join("\n");
                throw new AtError(messages.inputUnmatched, location);
            }
            else {
                throw errors[0];
            }
        }
        else if (this.array) {
            return this.array.extract(str);
        }
        else if (this.dictionary) {
            return this.dictionary.extract(str);
        }

        return str;
    }

    public toJSON(): any {
        const json: any = { };

        // Sets the optional `has`.
        if (this.has !== undefined) {
            json.has = this.has;
        }

        // Sets the optional `between`.
        if (this.between !== undefined) {
            if (this.betweenIsArray) {
                json.between = this.between.map(item => item.toJSON());
            }
            else {
                json.between = this.between[0].toJSON();
            }
        }

        // Sets the optional `process`.
        if (this.process !== undefined) {
            if (this.processIsArray) {
                json.process = this.process.map(item => item.toJSON());
            }
            else {
                json.process = this.process[0].toJSON();
            }
        }

        // Sets the optional `value`.
        if (this.value !== undefined) {
            json.value = this.value;
        }

        // Sets the optional `slice`.
        if (this.slice !== undefined) {
            if (this.sliceIsArray) {
                json.slice = this.slice.map(item => item.toJSON());
            }
            else {
                json.slice = this.slice[0].toJSON();
            }
        }

        // Sets the optional `array`.
        if (this.array !== undefined) {
            json.array = this.array.toJSON();
        }

        // Sets the optional `dictionary`.
        if (this.dictionary !== undefined) {
            json.dictionary = this.dictionary.toJSON();
        }

        return json;
    }
}
