babel-plugin-pattern-matching
=====

**Transform "haskel like" pattern matching.**

Syntax analyzing based on **bitwise operators like |(OR) and &(AND)**.
 
Transforms to javascript function that comes with plugin as a helpers library.

## Available Patterns

#### Array

```js
let pattern = []; //empty array
    pattern = [x, y]; //array with one or more elements
    pattern = [x, y, ...ys]; //array with two or more elements
    pattern = all&[x, y]; //array with two or more elements, resulting function will receive additional argument 'all' equal to whole array
    pattern = ([x, y, ...ys], [x]); //two arguments as array, where first length >= 2, second >= 1
```

#### Object

```js
let pattern = {}; //empty object
    pattern = {x, y}; //object with keys 'x' and 'y'
    pattern = {x:n, y}; //object with keys 'x' and 'y', where x will be renamed to n
    pattern = {x: {m}, ...rest};
    //object with keys 'x' which is equal object with key 'm', resulting function will receive additional arg. rest
    pattern = {x: {m}, y: [x, ...xs]} //object with keys 'x' and 'y' where y is array that has at least one element
    pattern = ({x}, all&{y}) // two arguments as objects where 1st has x property, second has 'y', 'all' - grouping
    pattern = ({x: all&{y}}, all2&{t}) //nested grouping   
```

#### Primitives

```js
let pattern = "a" | "result is a"; //for string with 'a' char
    pattern = 0 | "result is 0"; //for num eq. 0
    pattern = true | "result is true"; //for booleans
    pattern = null | "result is null"; //for null
    pattern = undefined | "result is undefined"; //for argument that eq. void 0
    pattern = NaN | "result is NaN"; //for NaN 
```

#### Catch All

```js
let pattern = n | "one argument";
    pattern = (n, m) | "two arguments"
```

## Example

Pattern
```js
let pattern = [] | "result 0";
    pattern = [x, z] | `result ${x + z}`;   
 
//execute
pattern([]) //result 0
pattern([1, 2]) //result 3
```

Transforms to
```js
let pattern = match(
	[arrayIsEmpty(), args0 => (() => "result 0")(...getArgs()(args0))],
	[lengthIsEqOrAbove(2), args0 => ((x, z) => `result ${x + y}`)(...getArgs([0, 1])(args0))]
);
```

Pattern
```js
let pattern = {n: x} | `result ${x}`;
    pattern = ({n: x}, all&[y, ...ys]) | `result ${x}, ${all}, ${y}, ${ys}`;
  
//execute
pattern({n: 10}) //result 10
pattern({n: 10}, [1, 2, 3]) //result 10, [1, 2, 3], 1, [2, 3]
```

Transforms to
```js
let pattern = match(
	[andPredicate(
		keysExists("n"),
		objKeysLengthIsEqOrAbove(1)
	), args0 => (x => `result ${x}`)(...getArgs(["n"])(args0))],
	[andPredicate(
		keysExists("n"),
		objKeysLengthIsEqOrAbove(1)
	), lengthIsEqOrAbove(1), (args0, args1) => (
		(x, all, y, ys) => `result ${x}, ${all}, ${y}, ${ys}`)
			(...getArgs(["n"], ["$$get-all-object", 0, "$$get-rest-params"])
				(args0, args1)
			)
	]
);
```

##Note

**The order of patterns is very important**

```js
let pattern = [x] | 'first pattern'; 
    pattern = [x, y, ...ys] | 'second pattern'; 

pattern([1,2,3]) //first pattern
pattern([1]) //first pattern
````

**To get correct behavior be careful with ordering!**

```js
let pattern = [x, y, ...ys]  | 'first pattern'; 
    pattern = [x] | 'second pattern'; 

pattern([1,2,3]) //first pattern
pattern([1]) //second pattern
````

## Install

```shell
$ npm i --save babel-plugin-pattern-matching
```

## Usage

```json
{
  "plugins": ["pattern-matching", "transform-object-rest-spread"],
  "presets": ["es2015"]
}
```

Set plugin options using an array of `[pluginName, optionsObject]`.

```json
{
  "plugins": [["pattern-matching", { "skipLib": "true", "enableByComment": "true" }]]
}
```
> **skipLib** - won't add the match-helper code to program
>
> **enableByComment** - will transform patterns just when leading comment "@match" will be added
```js
//@match
let pattern = [x, y, ...ys]  | 'first pattern'; 
    pattern = [x] | 'second pattern'; 
```

