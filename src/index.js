import matchHelper from "./match-helper";

const $$_SKIP = '_';
const $$_isNaN = '_isNaN';
const $$isNull = 'isNull';
const $$isValue = 'isValue';
const $$isUndefined = 'isUndefined';
const $$catchAll = 'catchAll';
const $$lengthIsEqOrAbove = 'lengthIsEqOrAbove';
const $$arrayIsEmpty = 'arrayIsEmpty';
const $$keyPredicate = 'keyPredicate';
const $$keysExists = 'keysExists';
const $$isEmptyObject = 'isEmptyObject';
const $$objKeysLengthIsEqOrAbove = 'objKeysLengthIsEqOrAbove';
const $$andPredicate = 'andPredicate';
const $$getRestParams = '$$get-rest-params';
const $$getAllObject = '$$get-all-object';
const $$args = 'args';
const $$getArgs = 'getArgs';
const $$match = 'match';
const $$leadingComment = '@match';
const $$disableComment = '@disable-match';

function analyzeBinary(path, t) {
    let operator = path.node && path.node.operator || path.operator;
    return (
            path.isBinaryExpression
            && path.isBinaryExpression()
            || t && t.isBinaryExpression(path)
        ) && operator === '|';
}

function analyzeDeclaration(path) {
    if (path.node.declarations.length !== 1) return false;
    let declaration = path.get('declarations.0');

    return declaration.get('init').node
        && analyzeBinary(declaration.get('init'))
        && declaration || false;
}

const isUndefined = (block) => block.name === 'undefined';

const analyzeExpression = path => path.node
    && path.isExpressionStatement()
    && path.get('expression')
    && path.get('expression').isAssignmentExpression()
    && path.get('expression') || false;

const getVariableName = declaration => declaration.node.id.name;
const isRestKey = (block, t) => t.isSpreadProperty(block);
const getTypePredicate = type => (typePredicates[type] || (() => false));
const getTypeArguments = type => (typeArguments[type] || (() => false));
const getTypedParams = type => (getTypeParams[type] || (() => false));

const typePredicates = {
    ArrowFunctionExpression: (block, t) => t.callExpression(t.identifier($$isValue), [block]),
    CallExpression: (block, t) => t.callExpression(t.identifier($$isValue), [block]),
    NullLiteral: (block, t) => t.callExpression(t.identifier($$isNull), []),
    StringLiteral: (block, t) => t.callExpression(t.identifier($$isValue), [block]),
    NumericLiteral: (block, t) => t.callExpression(t.identifier($$isValue), [block]),
    BooleanLiteral: (block, t) => t.callExpression(t.identifier($$isValue), [block]),
    Identifier(block, t, scope) {
        if (block.name === 'undefined') {
            return t.callExpression(t.identifier($$isUndefined), [])
        } else if (block.name === 'NaN') {
            return t.callExpression(t.identifier($$_isNaN), [])
        } else if(scope.hasBinding(block.name)){
            return t.callExpression(t.identifier($$isValue), [block])
        }
        return t.callExpression(t.identifier($$catchAll), [])
    },
    SequenceExpression: (block, t, scope) => block.expressions.map(ex => getTypePredicate(ex.type)(ex, t, scope)),
    ArrayExpression (block, t) {
        let name, value;
        if (block.elements.length) {
            name = $$lengthIsEqOrAbove;
            value = block.elements.some(e => t.isSpreadElement(e)) ? block.elements.length - 1 : block.elements.length
        } else {
            name = $$arrayIsEmpty;
        }

        return t.callExpression(t.identifier(name), value ? [t.numericLiteral(value)] : []);
    },
    BinaryExpression: (block, t, scope) => (block.operator === '&') ? getTypePredicate(block.right.type)(block.right, t, scope) : null,
    ObjectProperty: (property, block, t, scope) => {
        if (!t.isIdentifier(block) || isUndefined(block) || scope.hasBinding(block.name)) {
            return t.callExpression(
                t.identifier($$keyPredicate),
                [
                    t.stringLiteral(property),
                    getTypePredicate(block.type)(block, t, scope)
                ]
            )
        } else {
            return t.callExpression(
                t.identifier($$keysExists),
                [t.stringLiteral(property)]
            )
        }
    },
    ObjectExpression: (block, t, scope) => {
        if (!block.properties.length) {
            return t.callExpression(t.identifier($$isEmptyObject), []);
        } else {
            const keysLength = block.properties.filter(e => {
                return !t.isSpreadProperty(e)
                    && !t.isNullLiteral(e.value)
                    && !isUndefined(e.value)
            }).length;
            const keysExpr = t.callExpression(
                t.identifier($$objKeysLengthIsEqOrAbove),
                [t.numericLiteral(keysLength)]
            );

            const props = block.properties.filter(p => !isRestKey(p, t));
            if (!props.length) return keysExpr;
            let predicates = [keysExpr];
            for (let p of props) {
                predicates = [
                    getTypePredicate('ObjectProperty')(p.key.name, p.value, t, scope),
                    ...predicates
                ].filter(p => !!p);
            }

            if (predicates.length) {
                return t.callExpression(
                    t.identifier($$andPredicate),
                    predicates
                );
            }
        }
        return null;
    }
};

let typeArguments = {
    NumericLiteral: (block, t, scope) => t.identifier(block.name),
    BooleanLiteral: (block, t, scope) => t.identifier(block.name),
    StringLiteral: (block, t, scope) => t.identifier(block.name),
    Identifier: (block, t, scope) => !scope.hasBinding(block.name) ? t.identifier(block.name) : null,
    SpreadElement: (block, t, scope) => t.identifier(block.argument.name),
    SequenceExpression: (block, t, scope) => block.expressions.map(ex => getTypeArguments(ex.type)(ex, t, scope)),
    ArrayExpression: (block, t, scope) => {
        return block.elements.length ? block.elements.map(a => {
            let res = getTypeArguments((a || {type: 'Skip'}).type)(a, t, scope);
            return Array.isArray(res) ? res[0] : res
        }) : false
    },
    BinaryExpression: (block, t, scope) => {
        if (block.operator === '&') {
            const res = getTypeArguments(block.right.type)(block.right, t, scope);
            if (res) return [t.identifier(block.left.name), ...res]
        }
        return null
    },
    ObjectProperty: (block, t, scope) => t.isIdentifier(block.value) ? typeArguments.Identifier(block.value, t, scope) : getTypeArguments(block.value.type)(block.value, t, scope),
    SpreadProperty: (block, t, scope) => typeArguments.Identifier(block.argument, t, scope),
    ObjectExpression: (block, t, scope) => block.properties.length
        ? block.properties.reduce((acc, next) => {
            const res = getTypeArguments(next.type)(next, t, scope);
            return [...acc, ...(Array.isArray(res) ? res : [res])]
        }, [])
        : false
};

let getTypeParams = {
    BooleanLiteral: (block, t, nested) =>  nested ? t.arrayExpression([]) : null,
    NumericLiteral: (block, t, nested) =>  nested ? t.arrayExpression([]) : null,
    StringLiteral: (block, t, nested) =>  nested ? t.arrayExpression([]) : null,
    SequenceExpression: (block, t, nested, scope) => block.expressions.map(ex => getTypedParams(ex.type)(ex, t, nested, scope)),
    ArrayExpression: (block, t, nested) => block.elements.length
        ? t.arrayExpression(
        block.elements.map((a, i) => {
            return (a != null) ?
                t.isSpreadElement(a) ?
                    t.stringLiteral($$getRestParams) :
                        t.isIdentifier(a) && a.name !== $$_SKIP ? t.numericLiteral(i) : false
                : false
        }).filter(a=> !!a)
    ) : false,
    BinaryExpression: (block, t, nested, scope) => {
        if (block.operator === '&') {
            let res = getTypedParams(block.right.type)(block.right, t, true, scope);
            if (res.elements) res.elements = [t.stringLiteral($$getAllObject), ...res.elements];
            return res;
        }
        return null;
    },
    ObjectProperty: (block, t, nested, scope) => {
        let rValue;
        if (t.isIdentifier(block.value)) {
            rValue = !isUndefined(block.value)
                && !scope.hasBinding(block.value.name)
                    ? t.stringLiteral(block.key.name) : null;
        }	else {
            const val = getTypedParams(block.value.type)(block.value, t, true, scope);
            rValue = val ? t.objectExpression([
                t.objectProperty(t.identifier(block.key.name), val)
            ]) : null
        }
        return rValue
    },
    SpreadProperty: (block, t) => t.stringLiteral($$getRestParams),
    ObjectExpression: (block, t, nested, scope) => {
        const props = block.properties.length
            ? block.properties.map(p => getTypedParams(p.type)(p, t, true, scope))
            : [];

        const filtered = props.filter(f => f != void 0);
        return filtered && filtered.length ? t.arrayExpression(filtered) : false
    }
};

function getFunctionsCall(left, right, t, scope) {
    const argName = $$args;
    let args = getTypeArguments(left.type)(left, t, scope);
    let someParams = getTypedParams(left.type)(left, t, false, scope);

    if (!t.isSequenceExpression(left)) {
        someParams = [someParams];
        args = [args];
    }

    let params = [];

    if (!left.name || left.name !== 'NaN' && left.name !== 'undefined') {
        params = args.filter(a => !!a && a.name !== $$_SKIP).reduce((acc, n) => {
            return [...acc, ...(Array.isArray(n) ? n.filter(a => !!a && !isUndefined(a) && a.name && a.name !== $$_SKIP) : n.name ? [n] : [])]
        }, []);
    }

    const argsToPut = args.reduce((acc, next, index) => [...acc, argName + index], []).map(a => t.identifier(a));
    const argsToExec = args.reduce(
        (acc, next, index) => 
            next && next.name !== $$_SKIP 
                ? [...acc, argName + index] 
                : acc,
            []).map(a => t.identifier(a));

    const body = t.arrowFunctionExpression(
        params,
        right
    );

    return t.arrowFunctionExpression(
        argsToPut,
        t.callExpression(body, [
            t.spreadElement(
                t.callExpression(
                    t.callExpression(
                        t.identifier($$getArgs),
                        someParams.filter(s => !!s)
                    ),
                    argsToExec
                )
            )
        ])
    )
}

function collectPatterns(t) {
    let patterns = {};
    return {
        addPattern (name, binary, scope){
            patterns[name] = patterns[name] || [];
            const predicates = getTypePredicate(binary.left.type)(binary.left, t, scope);
            if (predicates) {
                patterns[name].push(t.arrayExpression([
                    ...(Array.isArray(predicates) ? predicates : [predicates]).filter(f => !!f),
                    getFunctionsCall(binary.left, binary.right, t, scope)
                ]))
            }
        },
        getPattern (name){
            return patterns[name];
        },
        reset (name) {
            patterns[name] = [];
        }
    }
}

export default function (babel) {
    const {types: t} = babel;
    return {
        pre() {
            this.patterns = collectPatterns(t);
        },
        visitor: {
            Program: {
                enter(path, state) {
                    !state.opts || !state.opts.skipLib && path.unshiftContainer('body', matchHelper());
                }
            },
            VariableDeclaration(path, state) {
                const alwaysEnabled = !state.opts || !state.opts.enableByComment;

                if (
                    (
                        !alwaysEnabled
                        && (!path.node.leadingComments || !path.node.leadingComments.some(l => l.value.includes($$leadingComment)))
                    ) || (
                        alwaysEnabled
                        && (path.node.leadingComments && path.node.leadingComments.length && path.node.leadingComments.some(l => l.value.includes($$disableComment)))
                    )
                ) return;

                let declaration;
                if (declaration = analyzeDeclaration(path)) {
                    const name = getVariableName(declaration);
                    let key = path.key;
                    let lookUp = true;
                    const nodes = [];

                    this.patterns.addPattern(name, declaration.get('init').node, path.scope);

                    do {
                        let sib = path.getSibling(++key);
                        let expression;
                        if (
                            (expression = analyzeExpression(sib))
                            && expression.node.left.name === name
                            && analyzeBinary(expression.node.right, t)
                        ) {
                            this.patterns.addPattern(name, expression.node.right, path.scope);
                            nodes.push(sib);
                        } else {
                            lookUp = false;
                        }
                    } while (lookUp);

                     path.replaceWithMultiple([
                        t.variableDeclaration('let', [
                            t.variableDeclarator(
                                t.identifier(name),
                                t.callExpression(
                                  t.identifier($$match),
                                  this.patterns.getPattern(name)
                                )
                            )
                        ])
                    ]);

                    this.patterns.reset(name);
                    nodes.forEach(ch => ch.remove())
                }
            },
            ExpressionStatement(path){
            }
        }
    };
}
