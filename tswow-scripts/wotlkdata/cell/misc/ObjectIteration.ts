import { getTransient } from "./Transient";

/*
 * This file is part of tswow (https://github.com/tswow)
 *
 * Copyright (C) 2020 tswow <https://github.com/tswow/>
 * This program is free software: you can redistribute it and/or
 * modify it under the terms of the GNU General Public License as
 * published by the Free Software Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */
export type TypeOfTypes = 'string' | 'null' | 'number' | 'bigint' | 'boolean' | 'symbol' | 'undefined' | 'object' | 'function';

let visitStack : any[] = [];

export const Objects = {
    // https://stackoverflow.com/questions/8024149/is-it-possible-to-get-the-non-enumerable-inherited-property-names-of-an-object
    getAllPropertyNames(obj: any) {
        const result = new Set();
        const transient = getTransient(obj);
        while (obj) {
            Object.getOwnPropertyNames(obj).forEach(p => {
                // proto is a bad property
                if (p === '__proto__' || transient.includes(p)) {
                    return;
                }
                result.add(p);
            });
            obj = Object.getPrototypeOf(obj);
        }

        return result;
    },

    objectifyObj(thiz: any) {
        const obj: {[key: string]: any} = {};
        visitStack.push(thiz);

        Objects.getAllPropertyNames(thiz).forEach((key: any) => {
            try {
                if (thiz[key] !== undefined && thiz[key] !== null) {
                    const val = thiz[key];
                    if (visitStack.findIndex((x) => x === val) >= 0) {
                        return;
                    }

                    if (typeof(val) !== 'object') {
                        return;
                    }

                    if (!val.objectify || typeof(val.objectify) !== 'function') {
                        return;
                    }

                    if (typeof(val.exists) === 'function' && !val.exists()) {
                        return;
                    }

                    obj[key] = val.objectify();
                }
            } catch(err) {
                obj[key] = "ERROR";
            }
        });

        visitStack.pop();
        return obj;
    },

    mapObject(
        objIn: any, type: TypeOfTypes[],
        filter: (key: string, obj: any) => boolean,
        map?: (key: string, obj: any) => any) {

        const objOut: {[key: string]: any} = {};

        Objects.getAllPropertyNames(objIn).forEach((x: any) => {
            const val = objIn[x];
            if (val === null && ! type.includes('null')) {
                return;
            } else if (val === undefined && ! type.includes('undefined')) {
                return;
            } else if (!type.includes(typeof(val))) {
                return;
            }

            if (filter ? filter(x, val) : true) {
                objOut[x] = map ? map(x, val) : val;
            }
        });
        return objOut;
    }
};