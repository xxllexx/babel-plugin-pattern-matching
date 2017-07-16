'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = function (babel) {
    var t = babel.types;

    return {
        pre: function pre() {
            this.patterns = collectPatterns(t);
        },

        visitor: {
            Program: {
                enter: function enter(path, state) {
                    !state.opts || !state.opts.skipLib && path.unshiftContainer('body', (0, _matchHelper2.default)());
                }
            },
            VariableDeclaration: function VariableDeclaration(path, state) {
                var alwaysEnabled = !state.opts || !state.opts.enableByComment;

                if (!alwaysEnabled && (!path.node.leadingComments || !path.node.leadingComments.some(function (l) {
                    return l.value.includes($$leadingComment);
                })) || alwaysEnabled && path.node.leadingComments && path.node.leadingComments.length && path.node.leadingComments.some(function (l) {
                    return l.value.includes($$disableComment);
                })) return;

                var declaration = void 0;
                if (declaration = analyzeDeclaration(path)) {
                    var name = getVariableName(declaration);
                    var key = path.key;
                    var lookUp = true;
                    var nodes = [];

                    this.patterns.addPattern(name, declaration.get('init').node);

                    do {
                        var sib = path.getSibling(++key);
                        var expression = void 0;
                        if ((expression = analyzeExpression(sib)) && expression.node.left.name === name && analyzeBinary(expression.node.right, t)) {
                            this.patterns.addPattern(name, expression.node.right);
                            nodes.push(sib);
                        } else {
                            lookUp = false;
                        }
                    } while (lookUp);

                    path.replaceWithMultiple([t.variableDeclaration('let', [t.variableDeclarator(t.identifier(name), t.callExpression(t.identifier($$match), this.patterns.getPattern(name)))])]);
                    this.patterns.reset(name);
                    nodes.forEach(function (ch) {
                        return ch.remove();
                    });
                }
            },
            ExpressionStatement: function ExpressionStatement(path) {}
        }
    };
};

var _matchHelper = require('./match-helper');

var _matchHelper2 = _interopRequireDefault(_matchHelper);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var $$_SKIP = '_';
var $$_isNaN = '_isNaN';
var $$isNull = 'isNull';
var $$isValue = 'isValue';
var $$isUndefined = 'isUndefined';
var $$catchAll = 'catchAll';
var $$lengthIsEqOrAbove = 'lengthIsEqOrAbove';
var $$arrayIsEmpty = 'arrayIsEmpty';
var $$keyPredicate = 'keyPredicate';
var $$keysExists = 'keysExists';
var $$isEmptyObject = 'isEmptyObject';
var $$objKeysLengthIsEqOrAbove = 'objKeysLengthIsEqOrAbove';
var $$andPredicate = 'andPredicate';
var $$getRestParams = '$$get-rest-params';
var $$getAllObject = '$$get-all-object';
var $$args = 'args';
var $$getArgs = 'getArgs';
var $$match = 'match';
var $$leadingComment = '@match';
var $$disableComment = '@disable-match';

function analyzeBinary(path, t) {
    var operator = path.node && path.node.operator || path.operator;
    return (path.isBinaryExpression && path.isBinaryExpression() || t && t.isBinaryExpression(path)) && operator === '|';
}

function analyzeDeclaration(path) {
    if (path.node.declarations.length !== 1) return false;
    var declaration = path.get('declarations.0');

    return declaration.get('init').node && analyzeBinary(declaration.get('init')) && declaration || false;
}

var isUndefined = function isUndefined(block) {
    return block.name === 'undefined';
};

var analyzeExpression = function analyzeExpression(path) {
    return path.node && path.isExpressionStatement() && path.get('expression') && path.get('expression').isAssignmentExpression() && path.get('expression') || false;
};

var getVariableName = function getVariableName(declaration) {
    return declaration.node.id.name;
};
var isRestKey = function isRestKey(block, t) {
    return t.isSpreadProperty(block);
};
var getTypePredicate = function getTypePredicate(type) {
    return typePredicates[type] || function () {
        return false;
    };
};
var getTypeArguments = function getTypeArguments(type) {
    return typeArguments[type] || function () {
        return false;
    };
};
var getTypedParams = function getTypedParams(type) {
    return getTypeParams[type] || function () {
        return false;
    };
};

var typePredicates = {
    NullLiteral: function NullLiteral(block, t) {
        return t.callExpression(t.identifier($$isNull), []);
    },
    StringLiteral: function StringLiteral(block, t) {
        return t.callExpression(t.identifier($$isValue), [block]);
    },
    NumericLiteral: function NumericLiteral(block, t) {
        return t.callExpression(t.identifier($$isValue), [block]);
    },
    BooleanLiteral: function BooleanLiteral(block, t) {
        return t.callExpression(t.identifier($$isValue), [block]);
    },
    Identifier: function Identifier(block, t) {
        if (block.name === 'undefined') {
            return t.callExpression(t.identifier($$isUndefined), []);
        } else if (block.name === 'NaN') {
            return t.callExpression(t.identifier($$_isNaN), []);
        }
        return t.callExpression(t.identifier($$catchAll), []);
    },

    SequenceExpression: function SequenceExpression(block, t) {
        return block.expressions.map(function (ex) {
            return getTypePredicate(ex.type)(ex, t);
        });
    },
    ArrayExpression: function ArrayExpression(block, t) {
        var name = void 0,
            value = void 0;
        if (block.elements.length) {
            name = $$lengthIsEqOrAbove;
            value = block.elements.some(function (e) {
                return t.isSpreadElement(e);
            }) ? block.elements.length - 1 : block.elements.length;
        } else {
            name = $$arrayIsEmpty;
        }

        return t.callExpression(t.identifier(name), value ? [t.numericLiteral(value)] : []);
    },

    BinaryExpression: function BinaryExpression(block, t) {
        return block.operator === '&' ? getTypePredicate(block.right.type)(block.right, t) : null;
    },
    ObjectProperty: function ObjectProperty(property, block, t) {
        if (!t.isIdentifier(block) || isUndefined(block)) {
            return t.callExpression(t.identifier($$keyPredicate), [t.stringLiteral(property), getTypePredicate(block.type)(block, t)]);
        } else {
            return t.callExpression(t.identifier($$keysExists), [t.stringLiteral(property)]);
        }
    },
    ObjectExpression: function ObjectExpression(block, t) {
        if (!block.properties.length) {
            return t.callExpression(t.identifier($$isEmptyObject), []);
        } else {
            var keysLength = block.properties.filter(function (e) {
                return !t.isSpreadProperty(e) && !t.isNullLiteral(e.value) && !isUndefined(e.value);
            }).length;
            var keysExpr = t.callExpression(t.identifier($$objKeysLengthIsEqOrAbove), [t.numericLiteral(keysLength)]);

            var props = block.properties.filter(function (p) {
                return !isRestKey(p, t);
            });
            if (!props.length) return keysExpr;
            var predicates = [keysExpr];
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = props[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var p = _step.value;

                    predicates = [getTypePredicate('ObjectProperty')(p.key.name, p.value, t)].concat(_toConsumableArray(predicates)).filter(function (p) {
                        return !!p;
                    });
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            if (predicates.length) {
                return t.callExpression(t.identifier($$andPredicate), predicates);
            }
        }
        return null;
    }
};

var typeArguments = {
    NumericLiteral: function NumericLiteral(block, t) {
        return t.identifier(block.name);
    },
    BooleanLiteral: function BooleanLiteral(block, t) {
        return t.identifier(block.name);
    },
    StringLiteral: function StringLiteral(block, t) {
        return t.identifier(block.name);
    },
    Identifier: function Identifier(block, t) {
        return t.identifier(block.name);
    },
    SpreadElement: function SpreadElement(block, t) {
        return t.identifier(block.argument.name);
    },
    SequenceExpression: function SequenceExpression(block, t) {
        return block.expressions.map(function (ex) {
            return getTypeArguments(ex.type)(ex, t);
        });
    },
    ArrayExpression: function ArrayExpression(block, t) {
        return block.elements.length ? block.elements.map(function (a) {
            var res = getTypeArguments((a || { type: 'Skip' }).type)(a, t);
            return Array.isArray(res) ? res[0] : res;
        }) : false;
    },
    BinaryExpression: function BinaryExpression(block, t) {
        if (block.operator === '&') {
            var res = getTypeArguments(block.right.type)(block.right, t);
            if (res) return [t.identifier(block.left.name)].concat(_toConsumableArray(res));
        }
        return null;
    },
    ObjectProperty: function ObjectProperty(block, t) {
        return t.isIdentifier(block.value) ? typeArguments.Identifier(block.value, t) : getTypeArguments(block.value.type)(block.value, t);
    },
    SpreadProperty: function SpreadProperty(block, t) {
        return typeArguments.Identifier(block.argument, t);
    },
    ObjectExpression: function ObjectExpression(block, t) {
        return block.properties.length ? block.properties.reduce(function (acc, next) {
            var res = getTypeArguments(next.type)(next, t);
            return [].concat(_toConsumableArray(acc), _toConsumableArray(Array.isArray(res) ? res : [res]));
        }, []) : false;
    }
};

var getTypeParams = {
    BooleanLiteral: function BooleanLiteral(block, t, nested) {
        return nested ? t.arrayExpression([]) : null;
    },
    NumericLiteral: function NumericLiteral(block, t, nested) {
        return nested ? t.arrayExpression([]) : null;
    },
    StringLiteral: function StringLiteral(block, t, nested) {
        return nested ? t.arrayExpression([]) : null;
    },
    SequenceExpression: function SequenceExpression(block, t) {
        return block.expressions.map(function (ex) {
            return getTypedParams(ex.type)(ex, t);
        });
    },
    ArrayExpression: function ArrayExpression(block, t, nested) {
        return block.elements.length ? t.arrayExpression(block.elements.map(function (a, i) {
            return a != null ? t.isSpreadElement(a) ? t.stringLiteral($$getRestParams) : t.isIdentifier(a) && a.name !== $$_SKIP ? t.numericLiteral(i) : false : false;
        }).filter(function (a) {
            return !!a;
        })) : false;
    },
    BinaryExpression: function BinaryExpression(block, t) {
        if (block.operator === '&') {
            var res = getTypedParams(block.right.type)(block.right, t, true);
            if (res.elements) res.elements = [t.stringLiteral($$getAllObject)].concat(_toConsumableArray(res.elements));
            return res;
        }
        return null;
    },
    ObjectProperty: function ObjectProperty(block, t) {
        var rValue = void 0;
        if (t.isIdentifier(block.value)) {
            rValue = !isUndefined(block.value) ? t.stringLiteral(block.key.name) : null;
        } else {
            var val = getTypedParams(block.value.type)(block.value, t, true);
            rValue = val ? t.objectExpression([t.objectProperty(t.identifier(block.key.name), val)]) : null;
        }
        return rValue;
    },
    SpreadProperty: function SpreadProperty(block, t) {
        return t.stringLiteral($$getRestParams);
    },
    ObjectExpression: function ObjectExpression(block, t) {
        var props = block.properties.length ? block.properties.map(function (p) {
            return getTypedParams(p.type)(p, t, true);
        }) : [];

        var filtered = props.filter(function (f) {
            return f != void 0;
        });
        return filtered && filtered.length ? t.arrayExpression(filtered) : false;
    }
};

function getFunctionsCall(left, right, t) {
    var argName = $$args;
    var args = getTypeArguments(left.type)(left, t);
    var someParams = getTypedParams(left.type)(left, t);

    if (!t.isSequenceExpression(left)) {
        someParams = [someParams];
        args = [args];
    }

    var params = [];

    if (!left.name || left.name !== 'NaN' && left.name !== 'undefined') {
        params = args.filter(function (a) {
            return !!a;
        }).reduce(function (acc, n) {
            return [].concat(_toConsumableArray(acc), _toConsumableArray(Array.isArray(n) ? n.filter(function (a) {
                return !!a && !isUndefined(a) && a.name && a.name !== $$_SKIP;
            }) : n.name ? [n] : []));
        }, []);
    }

    var argsToPut = args.reduce(function (acc, next, index) {
        return [].concat(_toConsumableArray(acc), [argName + index]);
    }, []).map(function (a) {
        return t.identifier(a);
    });
    var body = t.arrowFunctionExpression(params, right);

    return t.arrowFunctionExpression(argsToPut, t.callExpression(body, [t.spreadElement(t.callExpression(t.callExpression(t.identifier($$getArgs), someParams.filter(function (s) {
        return !!s;
    })), argsToPut))]));
}

function collectPatterns(t) {
    var patterns = {};
    return {
        addPattern: function addPattern(name, binary) {
            patterns[name] = patterns[name] || [];
            var predicates = getTypePredicate(binary.left.type)(binary.left, t);
            if (predicates) {
                patterns[name].push(t.arrayExpression([].concat(_toConsumableArray((Array.isArray(predicates) ? predicates : [predicates]).filter(function (f) {
                    return !!f;
                })), [getFunctionsCall(binary.left, binary.right, t)])));
            }
        },
        getPattern: function getPattern(name) {
            return patterns[name];
        },
        reset: function reset(name) {
            patterns[name] = [];
        }
    };
}