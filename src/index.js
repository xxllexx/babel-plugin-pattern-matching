import matchHelper from "./match-helper";

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
    NullLiteral: (block, t) => t.callExpression(t.identifier($$isNull), []),
    StringLiteral: (block, t) => t.callExpression(t.identifier($$isValue), [block]),
    NumericLiteral: (block, t) => t.callExpression(t.identifier($$isValue), [block]),
    BooleanLiteral: (block, t) => t.callExpression(t.identifier($$isValue), [block]),
    Identifier(block, t) {
        if (block.name === 'undefined') {
            return t.callExpression(t.identifier($$isUndefined), [])
        } else if (block.name === 'NaN') {
            return t.callExpression(t.identifier($$_isNaN), [])
        }
        return t.callExpression(t.identifier($$catchAll), [])
    },
    SequenceExpression: (block, t) => block.expressions.map(ex => getTypePredicate(ex.type)(ex, t)),
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
    BinaryExpression: (block, t) => (block.operator === '&') ? getTypePredicate(block.right.type)(block.right, t) : null,
    ObjectProperty: (property, block, t) => {
        if (!t.isIdentifier(block)) {
            return t.callExpression(
                t.identifier($$keyPredicate),
                [
                    t.stringLiteral(property),
                    getTypePredicate(block.type)(block, t)
                ]
            )
        } else {
            return t.callExpression(
                t.identifier($$keysExists),
                [t.stringLiteral(property)]
            )
        }
    },
    ObjectExpression: (block, t) => {
        if (!block.properties.length) {
            return t.callExpression(t.identifier($$isEmptyObject), []);
        } else {
            const keysLength = block.properties.filter(e => {
                return !t.isSpreadProperty(e) && !t.isNullLiteral(e.value)
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
                    getTypePredicate('ObjectProperty')(p.key.name, p.value, t),
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
    Identifier: (block, t) => t.identifier(block.name),
    SpreadElement: (block, t) => t.identifier(block.argument.name),
    SequenceExpression: (block, t) => block.expressions.map(ex => getTypeArguments(ex.type)(ex, t)),
    ArrayExpression: (block, t) => block.elements.length ? block.elements.map(a => getTypeArguments((a || {type: 'Skip'}).type)(a, t)) : false,
    BinaryExpression: (block, t) => (block.operator === '&') ? [t.identifier(block.left.name), ...getTypeArguments(block.right.type)(block.right, t)] : null,
    ObjectProperty: (block, t) => t.isIdentifier(block.value) ? typeArguments.Identifier(block.value, t) : getTypeArguments(block.value.type)(block.value, t),
    SpreadProperty: (block, t) => typeArguments.Identifier(block.argument, t),
    ObjectExpression: (block, t) => block.properties.length
        ? block.properties.reduce((acc, next) => {
        const res = getTypeArguments(next.type)(next, t);
        return [...acc, ...(Array.isArray(res) ? res : [res])]
    }, [])
        : false
};

let getTypeParams = {
    SequenceExpression: (block, t) => block.expressions.map(ex => getTypedParams(ex.type)(ex, t)),
    ArrayExpression: (block, t, property) => block.elements.length
        ? t.arrayExpression(
        block.elements.map((a, i) => {
            return (a != null) ? t.isSpreadElement(a) ? t.stringLiteral($$getRestParams) : t.numericLiteral(i) : false
        }).filter(a=> !!a)
    ) : false,
    BinaryExpression: (block, t) => {
        if (block.operator === '&') {
            let res = getTypedParams(block.right.type)(block.right, t);
            res.elements = [t.stringLiteral($$getAllObject), ...res.elements];
            return res;
        }
        return null;
    },
    ObjectProperty: (block, t) => {
        let rValue;
        if (t.isIdentifier(block.value)) {
            rValue = t.stringLiteral(block.key.name);
        }	else {
            const val = getTypedParams(block.value.type)(block.value, t, true);
            rValue = val ? t.objectExpression([
                t.objectProperty(t.identifier(block.key.name), val)
            ]) : null
        }
        return rValue
    },
    SpreadProperty: (block, t) => t.stringLiteral($$getRestParams),
    ObjectExpression: (block, t) => {
        const props = block.properties.length
            ? block.properties.map(p => getTypedParams(p.type)(p, t, true))
            : [];

        const filtered = props.filter(f => f != void 0);
        return filtered && filtered.length ? t.arrayExpression(filtered) : false
    }
};

function getFunctionsCall(left, right, t) {
    const argName = $$args;
    let args = getTypeArguments(left.type)(left, t);
    let someParams = getTypedParams(left.type)(left, t);

    if (!t.isSequenceExpression(left)) {
        someParams = [someParams];
        args = [args];
    }

    let params = [];

    if (!left.name || left.name !== 'NaN' && left.name !== 'undefined') {
        params = args.filter(a => !!a).reduce((acc, n) => {
            return [...acc, ...(Array.isArray(n) ? n.filter(a => !!a) : [n])]
        }, []);
    }

    const argsToPut = args.reduce((acc, next, index) => [...acc, argName + index], []).map(a => t.identifier(a));
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
                    argsToPut
                )
            )
        ])
    )
}

function collectPatterns(t) {
    let patterns = {};
    return {
        addPattern (name, binary){
            patterns[name] = patterns[name] || [];
            const predicates = getTypePredicate(binary.left.type)(binary.left, t);
            if (predicates) {
                patterns[name].push(t.arrayExpression([
                    ...(Array.isArray(predicates) ? predicates : [predicates]).filter(f => !!f),
                    getFunctionsCall(binary.left, binary.right, t)
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

                    this.patterns.addPattern(name, declaration.get('init').node);

                    do {
                        let sib = path.getSibling(++key);
                        let expression;
                        if (
                            (expression = analyzeExpression(sib))
                            && expression.node.left.name === name
                            && analyzeBinary(expression.node.right, t)
                        ) {
                            this.patterns.addPattern(name, expression.node.right);
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
