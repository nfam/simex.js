/**
 * @license
 * Copyright (c) 2015 Ninh Pham <ninhpham@hotmail.com>
 *
 * Use of this source code is governed by The MIT license.
 */

import { /* internal */ AtError, messages } from "./AtError";

export /* internal */
class Between {
    private readonly path: string;

    private readonly backward?: boolean;
    private readonly prefix?: string[];
    private readonly suffix?: string[];
    private readonly trim?: boolean;

    private readonly prefixIsArray: boolean;
    private readonly suffixIsArray: boolean;

    constructor(path: string, json: any) {
        this.path = path;

        // The container must be a dictionary.
        if (typeof json !== "object" || json instanceof Array || json === null) {
            throw new AtError(messages.between, this.path);
        }

        // Gets the optional `backward`.
        if (json.hasOwnProperty("backward")) {
            if (typeof json.backward !== "boolean") {
                throw new AtError(messages.backward, this.path + ".backward");
            }
            this.backward = json.backward;
        }

        // Gets the optional `prefix`.
        if (json.hasOwnProperty("prefix")) {
            this.prefixIsArray = json.prefix instanceof Array;
            let array: any[] = this.prefixIsArray ? json.prefix : [json.prefix];
            this.prefix = array.map((item, index) => {
                if (typeof(item) == "string") {
                    return item;
                }
                else {
                    throw new AtError(messages.prefix, this.path + ".prefix" + (this.prefixIsArray ? `[${index}]` : ""));
                }
            });
        }

        // Gets the optional `suffix`.
        if (json.hasOwnProperty("suffix")) {
            this.suffixIsArray = json.suffix instanceof Array;
            let array: any[] = this.suffixIsArray ? json.suffix : [json.suffix];
            this.suffix = array.map((item, index) => {
                if (typeof(item) == "string") {
                    return item;
                }
                else {
                    throw new AtError(messages.suffix, this.path + ".suffix" + (this.suffixIsArray ? `[${index}]` : ""));
                }
            });
        }

        // Gets the optional `suffix`.
        if (json.hasOwnProperty("trim")) {
            if (typeof json.trim !== "boolean") {
                throw new AtError(messages.trim, this.path + ".trim");
            }
            this.trim = json.trim;
        }
    }

    public extract(input: string): string {
        let str = input;

        // prefix
        let prefixes = this.prefix || []
        for (let index = 0; index < prefixes.length; index += 1) {
            const prefix = prefixes[index];
            if (prefix.length > 0) {
                if (this.backward) {
                    const end = str.lastIndexOf(prefix);
                    if (end >= 0) {
                        str = str.substring(0, end);
                    }
                    else {
                        const location = this.path + ".prefix" + (this.prefixIsArray ? `[${index}]` : "");
                        throw new AtError(messages.inputUnmatched, location);
                    }
                }
                else {
                    const start = str.indexOf(prefix);
                    if (start >= 0) {
                        str = str.substring(start + prefix.length);
                    }
                    else {
                        const location = this.path + ".prefix" + (this.prefixIsArray ? `[${index}]` : "");
                        throw new AtError(messages.inputUnmatched, location);
                    }
                }
            }
        }

        // suffix
        let suffixed = false;
        let suffixesCount = 0;
        for (const suffix of this.suffix || []) {
            suffixesCount += 1;
            if (suffix.length > 0) {
                if (this.backward) {
                    const start = str.lastIndexOf(suffix);
                    if (start >= 0) {
                        str = str.substring(start + suffix.length);
                        suffixed = true;
                        break;
                    }
                }
                else {
                    const end = str.indexOf(suffix);
                    if (end >= 0) {
                        str = str.substring(0, end);
                        suffixed = true;
                        break;
                    }
                }
            }
            else {
                suffixed = true;
                break;
            }
        }
        if (!suffixed && suffixesCount > 0) {
            throw new AtError(messages.inputUnmatched, this.path + ".suffix");
        }

        // trim
        if (this.trim) {
            str = str.trim();
        }

        return str;
    }

    public toJSON(): any {
        const json: any = { };
        if (this.backward !== undefined) {
            json.backward = this.backward;
        }
        if (this.prefix !== undefined) {
            json.prefix = this.prefixIsArray ? this.prefix : this.prefix[0];
        }
        if (this.suffix !== undefined) {
            json.suffix = this.suffixIsArray ? this.suffix : this.suffix[0];
        }
        if (this.trim !== undefined) {
            json.trim = this.trim;
        }
        return json;
    }
}
