/**
 * @license
 * Copyright (c) 2015 Ninh Pham <ninhpham@hotmail.com>
 *
 * Use of this source code is governed by The MIT license.
 */

import { /* internal */ AtError, messages } from "./AtError";
import { /* internal */ IProcessors } from "./Process";
import { /* internal */ Slice } from "./Slice";

export /* internal */
class ArrayExp {
    private readonly path: string;

    private readonly separator: string[];
    private readonly omit?: boolean;
    private readonly item?: Slice[];

    private readonly separatorIsArray: boolean;
    private readonly itemIsArray: boolean;

    constructor(path: string, json: any, processors: IProcessors) {
        this.path = path;

        // The container must be a dictionary.
        if (typeof json !== "object" || json instanceof Array || json === null) {
            throw new AtError(messages.array, this.path);
        }

        // Gets the required `separator`.
        if (json.hasOwnProperty("separator")) {
            this.separatorIsArray = json.separator instanceof Array;
            let array: any[] = this.separatorIsArray ? json.separator : [json.separator];
            this.separator = array.map((item, index) => {
                if (typeof(item) == "string" && item.length > 0) {
                    return item;
                }
                else {
                    throw new AtError(messages.separator, this.path + ".separator" + (this.separatorIsArray ? `[${index}]` : ""));
                }
            });
            if (this.separator.length == 0) {
                throw new AtError(messages.separator, this.path + ".separator");
            }
        }
        else {
            throw new AtError(messages.separatorMissing, this.path);
        }

        // Get the optional `omit`.
        if (json.hasOwnProperty("omit")) {
            if (typeof(json.omit) == "boolean") {
                this.omit = json.omit;
            }
            else {
                throw new AtError(messages.omit, this.path + ".omit");
            }
        }

        // Get the optional `item`.
        if (json.hasOwnProperty("item")) {
            this.itemIsArray = json.item instanceof Array
            let array: any[] = this.itemIsArray ? json.item : [json.item];
            this.item = array.map((item, index) => {
                if (item === null) {
                    if (this.itemIsArray) {
                        return null;
                    }
                    else {
                        throw new AtError(messages.item, this.path + ".item");
                    }
                }
                else {
                    let location = this.path + ".item" + (this.itemIsArray ? `[${index}]` : "");
                    return new Slice(location, item, processors, messages.item)
                }
            });
            if (this.item.length == 0) {
                throw new AtError(messages.item, this.path + ".item");
            }
        }
    }

    public extract(input: string): any {
        const results = [];

        let parts = [input];
        for (const separator of this.separator) {
            const groups = [];
            for (let i = 0; i < parts.length; i += 1) {
                groups[i] = parts[i].split(separator);
            }
            parts = [].concat.apply([], groups);
        }

        const omit = this.omit ? true : false;
        for (const part of parts) {
            if (omit && part === "") {
                continue
            }
            if (this.item) {
                if (this.itemIsArray) {
                    let errors: AtError[] = [];
                    for (const slice of this.item) {
                        if (slice) {
                            try {
                                results.push(slice.extract(part));
                                errors = [];
                                break;
                            }
                            catch (error) {
                                errors.push(error)
                            }
                        }
                        else {
                            errors = [];
                            break;
                        }
                    }
                    if (errors.length > 0) {
                        let location =  errors.map(error => error.at).join("\n");
                        throw new AtError(messages.inputUnmatched, location);
                    }
                }
                else {
                    results.push(this.item[0].extract(part));
                }
            }
            else {
                results.push(part)
            }
        }

        return results;
    }

    public toJSON(): any {
        const json: any = { };

        if (this.separatorIsArray) {
            json.separator = this.separator;
        }
        else {
            json.separator = this.separator[0];
        }

        if (this.omit !== undefined) {
            json.omit = this.omit;
        }

        if (this.item !== undefined) {
            if (this.itemIsArray) {
                json.item = this.item.map(slice => slice ? slice.toJSON() : null);
            }
            else {
                json.item = this.item[0].toJSON();
            }
        }

        return json;
    }
}
