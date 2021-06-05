/* 2.1 */

export const MISSING_KEY = '___MISSING___'

type PromisedStore<K, V> = {
    get(key: K): Promise<V>,
    set(key: K, value: V): Promise<void>,
    delete(key: K): Promise<void>
}


export function makePromisedStore<K, V>(): PromisedStore<K, V> {
    const store = new Map()
    return {
        get(key: K): Promise<V> {
            return new Promise((resolve, reject) => {
                if (store.has(key)){
                    resolve(store.get(key))
                }
                else{
                    reject(MISSING_KEY)
                }
            })
        },
        set(key: K, value: V): Promise<void> {
            return new Promise((resolve, reject) => {
                store.set(key,value);
                resolve();
            })
        },
        delete(key: K): Promise<void> {
            return new Promise((resolve, reject) => {
                if (store.has(key)){
                    store.delete(key)
                    resolve()
                }
                else{
                    reject(MISSING_KEY)
                }
            })
        },
    }
}

export function getAll<K, V>(store: PromisedStore<K, V>, keys: K[]): Promise<V[]> {
    return Promise.all(keys.map((key: K)=> store.get(key)))
}

/* 2.2 */

// ??? (you may want to add helper functions here)
//


export function asycMemo<T, R>(f: (param: T) => R): (param: T) => Promise<R> {
    const store = makePromisedStore<T,R>();
    return async (p: T): Promise<R> => {
        try {
            await store.get(p);
        } catch (error) {
            await store.set(p, f(p));
        }
        return store.get(p);
    }   
}



/* 2.3 */

export function lazyFilter<T>(genFn: () => Generator<T>, filterFn: (p: T)=>Boolean): () => Generator<T>{
    return function* (): Generator<T> {
        for (let x of genFn()) {
            if(filterFn(x)) {
                yield x;
            }
        }
    } 
}

export function lazyMap<T, R>(genFn: () => Generator<T>, mapFn: (p:T) =>R): () => Generator<R> {
    return function* (): Generator<R> {
        for (let x of genFn()) {
            yield mapFn(x);
        }
    } 
}

/* 2.4 */
// you can use 'any' in this question
export async function asyncWaterfallWithRetry(fns: [() => Promise<any>, ...((p:any) => Promise<any>)[]]): Promise<any> {
    const reducer = async function (acc: undefined|Promise<any>, curr:((p:any) => Promise<any>)): Promise<any> {
        for(let i = 0; i < 3; i++) {      
            try {
                const acc2 = await acc
                const res = await curr(acc2)
                return res
            } catch (error) {
                if (i === 2) {
                    throw error
                }
                await new Promise((resolve) => {
                    setTimeout(() => resolve(''), 2000)
                })
            }           
        }
    } 

    return fns.reduce(reducer, undefined)
}