/**
 * @license
 * Copyright (c) 2015 Ninh Pham <ninhpham@hotmail.com>
 *
 * Use of this source code is governed by The MIT license.
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ArrayExp =  (function () {
        function ArrayExp(path, json, processors) {
            var _this = this;
            this.path = path;
            if (typeof json !== "object" || json instanceof Array || json === null) {
                throw new AtError(messages.array, this.path);
            }
            if (json.hasOwnProperty("separator")) {
                this.separatorIsArray = json.separator instanceof Array;
                var array = this.separatorIsArray ? json.separator : [json.separator];
                this.separator = array.map(function (item, index) {
                    if (typeof (item) == "string" && item.length > 0) {
                        return item;
                    }
                    else {
                        throw new AtError(messages.separator, _this.path + ".separator" + (_this.separatorIsArray ? "[" + index + "]" : ""));
                    }
                });
                if (this.separator.length == 0) {
                    throw new AtError(messages.separator, this.path + ".separator");
                }
            }
            else {
                throw new AtError(messages.separatorMissing, this.path);
            }
            if (json.hasOwnProperty("omit")) {
                if (typeof (json.omit) == "boolean") {
                    this.omit = json.omit;
                }
                else {
                    throw new AtError(messages.omit, this.path + ".omit");
                }
            }
            if (json.hasOwnProperty("item")) {
                this.itemIsArray = json.item instanceof Array;
                var array = this.itemIsArray ? json.item : [json.item];
                this.item = array.map(function (item, index) {
                    if (item === null) {
                        if (_this.itemIsArray) {
                            return null;
                        }
                        else {
                            throw new AtError(messages.item, _this.path + ".item");
                        }
                    }
                    else {
                        var location_1 = _this.path + ".item" + (_this.itemIsArray ? "[" + index + "]" : "");
                        return new Slice(location_1, item, processors, messages.item);
                    }
                });
                if (this.item.length == 0) {
                    throw new AtError(messages.item, this.path + ".item");
                }
            }
        }
        ArrayExp.prototype.extract = function (input) {
            var results = [];
            var parts = [input];
            for (var _i = 0, _a = this.separator; _i < _a.length; _i++) {
                var separator = _a[_i];
                var groups = [];
                for (var i = 0; i < parts.length; i += 1) {
                    groups[i] = parts[i].split(separator);
                }
                parts = [].concat.apply([], groups);
            }
            var omit = this.omit ? true : false;
            for (var _b = 0, parts_1 = parts; _b < parts_1.length; _b++) {
                var part = parts_1[_b];
                if (omit && part === "") {
                    continue;
                }
                if (this.item) {
                    if (this.itemIsArray) {
                        var errors = [];
                        for (var _c = 0, _d = this.item; _c < _d.length; _c++) {
                            var slice = _d[_c];
                            if (slice) {
                                try {
                                    results.push(slice.extract(part));
                                    errors = [];
                                    break;
                                }
                                catch (error) {
                                    errors.push(error);
                                }
                            }
                            else {
                                errors = [];
                                break;
                            }
                        }
                        if (errors.length > 0) {
                            var location_2 = errors.map(function (error) { return error.at; }).join("\n");
                            throw new AtError(messages.inputUnmatched, location_2);
                        }
                    }
                    else {
                        results.push(this.item[0].extract(part));
                    }
                }
                else {
                    results.push(part);
                }
            }
            return results;
        };
        ArrayExp.prototype.toJSON = function () {
            var json = {};
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
                    json.item = this.item.map(function (slice) { return slice ? slice.toJSON() : null; });
                }
                else {
                    json.item = this.item[0].toJSON();
                }
            }
            return json;
        };
        return ArrayExp;
    }());
    var AtError =  (function (_super) {
        __extends(AtError, _super);
        function AtError(message, at) {
            var _this = _super.call(this, message) || this;
            if (at === "") {
                _this.at = "";
            }
            else if (at.indexOf("@ ") == 0) {
                _this.at = at;
            }
            else {
                _this.at = "@ " + at;
            }
            return _this;
        }
        return AtError;
    }(Error));
    function addMessageAt(error) {
        if (typeof error.at === "string" && typeof error.message === "string") {
            if (error.at !== "") {
                error.message += "\n" + error.at;
            }
        }
    }
    var messages = {
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
    var Between =  (function () {
        function Between(path, json) {
            var _this = this;
            this.path = path;
            if (typeof json !== "object" || json instanceof Array || json === null) {
                throw new AtError(messages.between, this.path);
            }
            if (json.hasOwnProperty("backward")) {
                if (typeof json.backward !== "boolean") {
                    throw new AtError(messages.backward, this.path + ".backward");
                }
                this.backward = json.backward;
            }
            if (json.hasOwnProperty("prefix")) {
                this.prefixIsArray = json.prefix instanceof Array;
                var array = this.prefixIsArray ? json.prefix : [json.prefix];
                this.prefix = array.map(function (item, index) {
                    if (typeof (item) == "string") {
                        return item;
                    }
                    else {
                        throw new AtError(messages.prefix, _this.path + ".prefix" + (_this.prefixIsArray ? "[" + index + "]" : ""));
                    }
                });
            }
            if (json.hasOwnProperty("suffix")) {
                this.suffixIsArray = json.suffix instanceof Array;
                var array = this.suffixIsArray ? json.suffix : [json.suffix];
                this.suffix = array.map(function (item, index) {
                    if (typeof (item) == "string") {
                        return item;
                    }
                    else {
                        throw new AtError(messages.suffix, _this.path + ".suffix" + (_this.suffixIsArray ? "[" + index + "]" : ""));
                    }
                });
            }
            if (json.hasOwnProperty("trim")) {
                if (typeof json.trim !== "boolean") {
                    throw new AtError(messages.trim, this.path + ".trim");
                }
                this.trim = json.trim;
            }
        }
        Between.prototype.extract = function (input) {
            var str = input;
            var prefixes = this.prefix || [];
            for (var index = 0; index < prefixes.length; index += 1) {
                var prefix = prefixes[index];
                if (prefix.length > 0) {
                    if (this.backward) {
                        var end = str.lastIndexOf(prefix);
                        if (end >= 0) {
                            str = str.substring(0, end);
                        }
                        else {
                            var location_3 = this.path + ".prefix" + (this.prefixIsArray ? "[" + index + "]" : "");
                            throw new AtError(messages.inputUnmatched, location_3);
                        }
                    }
                    else {
                        var start = str.indexOf(prefix);
                        if (start >= 0) {
                            str = str.substring(start + prefix.length);
                        }
                        else {
                            var location_4 = this.path + ".prefix" + (this.prefixIsArray ? "[" + index + "]" : "");
                            throw new AtError(messages.inputUnmatched, location_4);
                        }
                    }
                }
            }
            var suffixed = false;
            var suffixesCount = 0;
            for (var _i = 0, _a = this.suffix || []; _i < _a.length; _i++) {
                var suffix = _a[_i];
                suffixesCount += 1;
                if (suffix.length > 0) {
                    if (this.backward) {
                        var start = str.lastIndexOf(suffix);
                        if (start >= 0) {
                            str = str.substring(start + suffix.length);
                            suffixed = true;
                            break;
                        }
                    }
                    else {
                        var end = str.indexOf(suffix);
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
            if (this.trim) {
                str = str.trim();
            }
            return str;
        };
        Between.prototype.toJSON = function () {
            var json = {};
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
        };
        return Between;
    }());
    var Dictionary =  (function () {
        function Dictionary(path, json, processors) {
            var _this = this;
            this.path = path;
            if (typeof json !== "object" || json instanceof Array || json === null) {
                throw new AtError(messages.dictionary, this.path);
            }
            this.members = {};
            Object.keys(json).forEach(function (name) {
                var value = json[name];
                if (typeof value !== "object") {
                    throw new AtError(messages.member, _this.path + ("[\"" + name + "\"]"));
                }
                if (value instanceof Array) {
                    var slices = [];
                    for (var index = 0; index < value.length; index += 1) {
                        var item = value[index];
                        if (item === null) {
                            slices.push(null);
                        }
                        else {
                            var location_5 = _this.path + ("[\"" + name + "\"][" + index + "]");
                            slices.push(new Slice(location_5, item, processors, messages.member));
                        }
                    }
                    if (slices.length == 0) {
                        throw new AtError(messages.member, _this.path + ("[\"" + name + "\"]"));
                    }
                    _this.members[name] = slices;
                }
                else {
                    var location_6 = _this.path + ("[\"" + name + "\"]");
                    _this.members[name] = new Slice(location_6, value, processors, messages.member);
                }
            });
        }
        Dictionary.prototype.extract = function (input) {
            var dictionary = {};
            var names = Object.keys(this.members);
            for (var _i = 0, names_1 = names; _i < names_1.length; _i++) {
                var name_1 = names_1[_i];
                var member = this.members[name_1];
                if (member instanceof Array) {
                    var errors = [];
                    for (var index = 0; index < member.length; index += 1) {
                        var item = member[index];
                        if (item === null) {
                            errors = [];
                            break;
                        }
                        else {
                            try {
                                dictionary[name_1] = item.extract(input);
                                errors = [];
                                break;
                            }
                            catch (error) {
                                errors.push(error);
                            }
                        }
                    }
                    if (errors.length > 0) {
                        var location_7 = errors.map(function (error) { return error.at; }).join("\n");
                        throw new AtError(messages.inputUnmatched, location_7);
                    }
                }
                else {
                    dictionary[name_1] = member.extract(input);
                }
            }
            return dictionary;
        };
        Dictionary.prototype.toJSON = function () {
            var _this = this;
            var json = {};
            Object.keys(this.members).forEach(function (name) {
                var member = _this.members[name];
                if (member instanceof Array) {
                    json[name] = member.map(function (item) { return item ? item.toJSON() : null; });
                }
                else {
                    json[name] = member.toJSON();
                }
            });
            return json;
        };
        return Dictionary;
    }());
    var Expression =  (function () {
        function Expression(json, processors) {
            processors = processors || {};
            try {
                if (typeof json !== "object" || json instanceof Array || json === null) {
                    throw new AtError(messages.expression, "");
                }
                if (json.hasOwnProperty("root")) {
                    this.root = new Slice("root", json.root, processors, messages.root);
                }
                else {
                    throw new AtError(messages.rootMissing, "");
                }
            }
            catch (error) {
                addMessageAt(error);
                throw error;
            }
        }
        Expression.prototype.extract = function (input) {
            try {
                var result = this.root.extract(input);
                return avoidMemoryLeak(result);
            }
            catch (error) {
                addMessageAt(error);
                throw error;
            }
        };
        Expression.prototype.toJSON = function () {
            return { root: this.root.toJSON() };
        };
        return Expression;
    }());
    exports.Expression = Expression;
    function avoidMemoryLeak(item) {
        if (typeof item === "string") {
            item = (" " + item).substring(1);
        }
        else if (typeof item === "object") {
            if (item === null) {
                return null;
            }
            else if (item instanceof Array) {
                for (var i = 0; i < item.length; i += 1) {
                    item[i] = avoidMemoryLeak(item[i]);
                }
            }
            else {
                Object.keys(item).forEach(function (key) {
                    item[key] = avoidMemoryLeak(item[key]);
                });
            }
        }
        return item;
    }
    var Process =  (function () {
        function Process(path, json, processors) {
            var _this = this;
            this.path = path;
            if (typeof json === "string") {
                this.processIsObject = false;
                this.by = json;
            }
            else if (typeof json === "object" && !(json instanceof Array || json === null)) {
                this.processIsObject = true;
                if (json.hasOwnProperty("by")) {
                    if (typeof json.by !== "string") {
                        throw new AtError(messages.by, this.path + ".by");
                    }
                    this.by = json.by;
                }
                else {
                    throw new AtError(messages.byMissing, this.path);
                }
                if (json.hasOwnProperty("with")) {
                    this.withIsArray = json.with instanceof Array;
                    var array = this.withIsArray ? json.with : [json.with];
                    this.with = array.map(function (item, index) {
                        if (typeof (item) == "string") {
                            return item;
                        }
                        else {
                            throw new AtError(messages.with, _this.path + ".with" + (_this.withIsArray ? "[" + index + "]" : ""));
                        }
                    });
                }
            }
            else {
                throw new AtError(messages.process, this.path);
            }
            this.func = processors[this.by];
            if (!this.func) {
                this.func = defaultProcessors[this.by];
                if (!this.func) {
                    throw new AtError(messages.processUndefined, this.path + (this.processIsObject ? ".by" : ""));
                }
            }
        }
        Process.prototype.extract = function (input) {
            try {
                return this.func(input, this.with);
            }
            catch (e) {
                var error = new AtError(messages.inputUnmatched, this.path);
                if (e.stack) {
                    error.stack = e.stack;
                }
                throw error;
            }
        };
        Process.prototype.toJSON = function () {
            if (this.processIsObject) {
                var json = { by: this.by };
                if (this.with) {
                    json.with = this.withIsArray ? this.with : this.with[0];
                }
                return json;
            }
            else {
                return this.by;
            }
        };
        return Process;
    }());
    var defaultProcessors = {
        "append": function (input, args) {
            return args ? (input + args.join('')) : input;
        },
        "prepend": function (input, args) {
            return args ? (args.join('') + input) : input;
        },
        "replace": function (input, args) {
            if (args) {
                for (var i = 0; i + 1 < args.length; i += 2) {
                    input = input.split(args[i]).join(args[i + 1]);
                }
            }
            return input;
        },
        "replaceTo": function (input, args) {
            if (args && args.length == 2) {
                return args[0].split(args[1]).join(input);
            }
            return input;
        },
        "unescape": function (input, args) {
            if (args) {
                for (var _i = 0, args_1 = args; _i < args_1.length; _i++) {
                    var arg = args_1[_i];
                    switch (arg) {
                        case 'xml':
                            input = input.replace(xmlRegex, function (s) {
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
                            input = input.replace(jsRegex, function (substr, __, varHex, longHex, shortHex, octal, specialCharacter, python) {
                                if (varHex !== undefined) {
                                    var code = parseInt(varHex, 16);
                                    return (isNaN(code) || code > 0xFFFF) ? substr : String.fromCharCode(code);
                                }
                                else if (longHex !== undefined) {
                                    var code = parseInt(longHex, 16);
                                    return String.fromCharCode(code);
                                }
                                else if (shortHex !== undefined) {
                                    var code = parseInt(shortHex, 16);
                                    return String.fromCharCode(code);
                                }
                                else if (octal !== undefined) {
                                    var code = parseInt(octal, 8);
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
    };
    var xmlRegex = /&#?[0-9a-zA-Z]+;?/g;
    var xmlMap = {
        "&lt;": "<",
        "&gt;": ">",
        "&quot;": "\"",
        "&apos;": "'",
        "&amp;": "&"
    };
    var jsRegex = /\\(u\{([0-9A-Fa-f]+)\}|u([0-9A-Fa-f]{4})|x([0-9A-Fa-f]{2})|([1-7][0-7]{0,2}|[0-7]{2,3})|(['"tbrnfv0\\]))/g;
    var jsMap = {
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
    var Slice =  (function () {
        function Slice(path, json, processors, typeError) {
            var _this = this;
            this.path = path;
            if (typeof json !== "object" || json instanceof Array || json === null) {
                throw new AtError(typeError, this.path);
            }
            if (json.hasOwnProperty("has")) {
                if (typeof json.has !== "string") {
                    throw new AtError(messages.has, this.path + ".has");
                }
                this.has = json.has;
            }
            if (json.hasOwnProperty("between")) {
                this.betweenIsArray = json.between instanceof Array;
                var array = this.betweenIsArray ? json.between : [json.between];
                this.between = array.map(function (item, index) {
                    var location = _this.path + ".between" + (_this.betweenIsArray ? "[" + index + "]" : "");
                    return new Between(location, item);
                });
            }
            if (json.hasOwnProperty("process")) {
                this.processIsArray = json.process instanceof Array;
                var array = this.processIsArray ? json.process : [json.process];
                this.process = array.map(function (item, index) {
                    var location = _this.path + ".process" + (_this.processIsArray ? "[" + index + "]" : "");
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
                this.sliceIsArray = json.slice instanceof Array;
                var array = this.sliceIsArray ? json.slice : [json.slice];
                this.slice = array.map(function (item, index) {
                    var location = _this.path + ".slice" + (_this.sliceIsArray ? "[" + index + "]" : "");
                    return new Slice(location, item, processors, messages.slice);
                });
                if (this.slice.length == 0) {
                    throw new AtError(messages.slice, this.path + ".slice");
                }
            }
            else if (json.hasOwnProperty("array")) {
                if (json.hasOwnProperty("dictionary")) {
                    throw new AtError(messages.subexpressions, this.path);
                }
                this.array = new ArrayExp(this.path + ".array", json.array, processors);
            }
            else if (json.hasOwnProperty("dictionary")) {
                this.dictionary = new Dictionary(this.path + ".dictionary", json.dictionary, processors);
            }
        }
        Slice.prototype.extract = function (input) {
            if (this.has && this.has.length > 0) {
                if (input.indexOf(this.has) < 0) {
                    throw new AtError(messages.inputUnmatched, this.path + ".has");
                }
            }
            var str = input;
            if (this.between) {
                for (var _i = 0, _a = this.between; _i < _a.length; _i++) {
                    var item = _a[_i];
                    str = item.extract(str);
                }
            }
            if (this.process) {
                for (var _b = 0, _c = this.process; _b < _c.length; _b++) {
                    var item = _c[_b];
                    str = item.extract(str);
                }
            }
            if (this.value !== undefined) {
                return this.value;
            }
            else if (this.slice) {
                var errors = [];
                for (var index = 0; index < this.slice.length; index += 1) {
                    var slice = this.slice[index];
                    try {
                        return slice.extract(str);
                    }
                    catch (error) {
                        errors.push(error);
                    }
                }
                if (this.sliceIsArray) {
                    var location_8 = errors.map(function (error) { return error.at; }).join("\n");
                    throw new AtError(messages.inputUnmatched, location_8);
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
        };
        Slice.prototype.toJSON = function () {
            var json = {};
            if (this.has !== undefined) {
                json.has = this.has;
            }
            if (this.between !== undefined) {
                if (this.betweenIsArray) {
                    json.between = this.between.map(function (item) { return item.toJSON(); });
                }
                else {
                    json.between = this.between[0].toJSON();
                }
            }
            if (this.process !== undefined) {
                if (this.processIsArray) {
                    json.process = this.process.map(function (item) { return item.toJSON(); });
                }
                else {
                    json.process = this.process[0].toJSON();
                }
            }
            if (this.value !== undefined) {
                json.value = this.value;
            }
            if (this.slice !== undefined) {
                if (this.sliceIsArray) {
                    json.slice = this.slice.map(function (item) { return item.toJSON(); });
                }
                else {
                    json.slice = this.slice[0].toJSON();
                }
            }
            if (this.array !== undefined) {
                json.array = this.array.toJSON();
            }
            if (this.dictionary !== undefined) {
                json.dictionary = this.dictionary.toJSON();
            }
            return json;
        };
        return Slice;
    }());
});
