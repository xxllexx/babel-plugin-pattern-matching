let func = ([x,,t, ...rest], [b, ...bs]) | x + z;
    func = (all&{x:t}, {n, d:all1&[x,...z], b: {s: all2&{y}}}) | console.log('first ', all, all1, all2);
    func = (all&{y:t}, {n, d:all1&[x,...z], b: {s: all2&{y}}}) | console.log('second ', all2, all1, all);
    func = (n, m) | console.log(n, m);
