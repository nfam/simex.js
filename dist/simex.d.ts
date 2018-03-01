/**
 * @license
 * Copyright (c) 2015 Ninh Pham <ninhpham@hotmail.com>
 *
 * Use of this source code is governed by The MIT license.
 */
/**
 * Represents an instance of `Expression`.
 * @export
 * @class Expression
 */
export declare class Expression {
    private readonly root;
    /**
     * Creates an instance of Expression.
     * @param {*} json The definition of expression in JSON.
     * @param {IProcessors} [processors] The collection of plugin process.
     * @throws {Error} if the provided expression does not comply the syntax.
     * @memberof Expression
     */
    constructor(json: any, processors?: IProcessors);
    /**
     * Returns the extraction content in JSON from input string.
     * @param {string} input Input input to extract content from.
     * @returns {*} Result content in JSON format.
     * @throws {ExtractionError} if the input input does not match the expression.
     * @memberof Expression
     */
    extract(input: string): any;
    /**
     * Returns the original expression in JSON.
     * @returns {*}
     * @memberof Expression
     */
    toJSON(): any;
}
/**
 * Holds all collection of user-defined processors.
 * @export
 * @interface IProcessors
 */
export interface IProcessors {
    [name: string]: (input: string, args?: string[]) => string;
}
