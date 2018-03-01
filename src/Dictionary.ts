/**
 * @license
 * Copyright (c) 2015 Ninh Pham <ninhpham@hotmail.com>
 *
 * Use of this source code is governed by The MIT license.
 */

import { /* internal */ AtError, messages } from "./AtError";
import { /* internal */ Slice } from "./Slice";
import { /* internal */ IProcessors } from "./Process";

export /* internal */
class Dictionary {
    private readonly path: string;

    private readonly members: { [name: string]: null | Slice | Slice[] };

    constructor(path: string, json: any, processors: IProcessors) {
        this.path = path;

        if (typeof json !== "object" || json instanceof Array || json === null) {
            throw new AtError(messages.dictionary, this.path);
        }

        this.members = {}
        Object.keys(json).forEach((name) => {
            const value = json[name];
            if (typeof value !== "object") {
                throw new AtError(messages.member, this.path + `["${name}"]`);
            }
            if (value instanceof Array) {
                let slices: Slice[] = []
                for (let index = 0; index < value.length; index += 1) {
                    let item = value[index];
                    if (item === null) {
                        slices.push(null);
                    }
                    else {
                        let location = this.path + `["${name}"][${index}]`;
                        slices.push(new Slice(location, item, processors, messages.member));
                    }
                }
                if (slices.length == 0) {
                    throw new AtError(messages.member, this.path + `["${name}"]`);
                }
                this.members[name] = slices;
            }
            else {
                let location = this.path + `["${name}"]`;
                this.members[name] = new Slice(location, value, processors, messages.member);
            }
        });
    }

    public extract(input: string): any {
        const dictionary: { [name: string]: any } = {};

        const names = Object.keys(this.members);
        for (const name of names) {
            const member = this.members[name];

            if (member instanceof Array) {
                let errors: AtError[] = [];
                for (let index = 0; index < member.length; index += 1) {
                    let item = member[index];
                    if (item === null) {
                        errors = [];
                        break;
                    }
                    else {
                        try {
                            dictionary[name] = item.extract(input);
                            errors = [];
                            break;
                        }
                        catch (error) {
                            errors.push(error)
                        }
                    }
                }
                if (errors.length > 0) {
                    let location =  errors.map(error => error.at).join("\n");
                    throw new AtError(messages.inputUnmatched, location);
                }
            }
            else {
                dictionary[name] = member.extract(input);
            }
        }

        return dictionary;
    }

    public toJSON(): any {
        const json: any = {};
        Object.keys(this.members).forEach((name) => {
            let member = this.members[name];
            if (member instanceof Array) {
                json[name] = member.map(item => item ? item.toJSON() : null);
            }
            else {
                json[name] = member.toJSON();
            }
        });
        return json;
    }
}
