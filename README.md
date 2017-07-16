babel-plugin-pattern-matching
=====

**Transform "haskell like" pattern matching.**

Syntax analyzing based on **bitwise operators like |(OR) and &(AND)**.
 
Transforms to javascript function that comes with plugin as a helpers library.

## Example

```js
//function declaration 
//let functionName = pattern-1 | function body for leading pattern 
//    functionName = pattern-2 | function body for leading pattern 
 
let factorial = 0 | 1;
    factorial = n | n * factorial(n - 1);

//execute
factorial(3); // 6

let fibonacci = 0 | 1;
    fibonacci = 1 | 1;
    fibonacci = num | fibonacci(num - 1) + fibonacci(num - 2); 
 
//execute
fibonacci(10); //89

```

## Available Patterns

#### Array

```js
[] //empty array
[x, y] //array with one or more elements
[x, y, ...ys] //array with two or more elements
[_, y, ...ys] //array with two or more elements, first one will be skiped
all&[x, y] //array with two or more elements, resulting function will receive additional argument 'all' equal to whole array
([x, y, ...ys], [x]) //two arguments as array, where first length >= 2, second >= 1
```

#### Object

```js
{} //empty object
{x, y} //object with keys 'x' and 'y'
{x:n, y} //object with keys 'x' and 'y', where x will be renamed to n
{x: {m}, ...rest} //object with keys 'x' which is equal object with key 'm', resulting function will receive additional arg. rest
{x: {m}, y: [x, ...xs]} //object with keys 'x' and 'y' where y is array that has at least one element
({x}, all&{y}) // two arguments as objects where 1st has x property, second has 'y', 'all' - grouping
({x: all&{y}}, all2&{t}) //nested grouping   
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

## Transformation

Pattern
```js
let pattern = [] | "result 0";
    pattern = [x, z] | `result ${x + z}`;   
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
npm
$ npm i --save babel-plugin-pattern-matching

yarn
$ yarn add babel-plugin-pattern-matching
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
> **enableByComment** - will transform patterns just when leading by comment "@match" will be added
```js
//@match
let pattern = [x, y, ...ys]  | 'first pattern'; 
    pattern = [x] | 'second pattern'; 
```

Or you can disable transformation in place by comment **"@disable-match"**

```js
//@disable-match
let regularOperation = 1 | 0; //1
```