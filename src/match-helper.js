import template from "babel-template";

export default template(`
  const isObject = (value) => {
    const type = typeof value;
    return value != null && (type == 'object' || type == 'function')
  }

  const curry = fn => {
    return (function n(..._args) {
      return function(...args) {
          return [..._args, ...args].length === fn.length ? fn(..._args, ...args) : n(..._args, ...args)
        };
    })()
  }

    function match (...rules) {
        return function(...args) {
            for(let i = 0; i < rules.length; i++) {
                let res, [callback, ...preds] = [...rules[i]].reverse();
    
                if(preds.length === args.length && preds.reverse().every((p, i)=> p(args[i]))) {
                    return callback(...args)
                }
            }
    
            return false;
        }
    }

  const omitParams = curry((keyArray, obj) => Object.keys(obj).filter(k => !keyArray.includes(k)).reduce((acc, k) => (acc[k] = obj[k], acc),{}));

  const andPredicate = (...predicates) => (...args) => predicates.every(p => p(...args));
  const keyPredicate = (key, ...predicates) => obj => andPredicate(...predicates)(obj[key]) || false;

  const isEmpty = (obj) => {
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
          return false
        }
      }
      return true;
  }

  const arrayIsEmpty = () => arr => Array.isArray(arr) && !arr.length;
  const lengthIsEqOrAbove = (length = 1) => arr => Array.isArray(arr) && arr.length >= length;

  const isEmptyObject = () => obj => !Array.isArray(obj) && isObject(obj) && isEmpty(obj);

  const objKeysLengthIsEqOrAbove = (length = 1) => obj => !isEmpty(obj) && lengthIsEqOrAbove(length)(Object.keys(obj));

  const keysExists = (...keys) => obj => {
    for (let k of keys) {
      if(isEmpty(obj) || !(k in obj) || !obj.hasOwnProperty(k)) return false
    }

    return true;
  }

  const catchAll = () => () => true
  const isDefined = () => obj => (obj !== void 0)
  const isValue = val => obj => val === obj
  const isNull = () => obj => obj === null
  const isUndefined = () => obj => obj === void 0
  const _isNaN = () => (obj) => isNaN(obj) 
  const _rest = '$$get-rest-params';
  const _allObj = '$$get-all-object';

  const getLevelArgs = (getter, arg) => {
    return getter.reduce((res0, key) => {
      if (!isObject(key)) {
        let k = [key];
        if (key !== _rest) {
          return [...res0, k.filter(_k => _k !== _rest && _k !== _allObj).reduce((ret, val) => ret[val], arg)]
        } else {

          //console.log(getter);
          let params = getter.reduce((o, g) => [...o, ...(isObject(g) ? Object.keys(g) : [g])], [])
                  .filter(_k => _k !== _rest && _k !== _allObj);

          return [
            ...res0,
            (Array.isArray(arg) || (typeof arg === 'string')
              ? arg.slice(params.length)
              : isObject(arg)
                ? omitParams(params, arg
                  ) : false
              )
          ].filter(a => !!a)
        }
      } else {
        let m = Object.keys(key).reduce((acc, k) => {
          return [
            ...acc,
            ...getLevelArgs(key[k], arg[k])
          ]
        }, [])

        return [...res0, ...m]; 
      }
      return res0;
    }, [])  
  } 

  const getArgs = (...getters) => (...args) => (getters.length)
      ? getters.reduce((acc, g, ind) => {
        return g.length && (args[ind] !== void 0) ? [
            ...acc, 
            ...getLevelArgs(g, args[ind])
          ] : acc;
      }, [])
      : args;
`);