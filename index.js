"use strict";
const selectorParser = require("postcss-selector-parser");
const processor = selectorParser();
const getOrDefault = (map, key) => {
    const set = map.get(key) || new Set();
    map.set(key, set);
    return set;
};
const plugin = () => {
    const declMap = new Map();
    return {
        postcssPlugin: "postcss-catalyst",
        // TODO: 只处理 class 选择器，跳过其他
        Rule(rule, helper) {
            var _a;
            const scope = ((_a = rule.parent) === null || _a === void 0 ? void 0 : _a.type) === "atrule"
                ? `${rule.parent.name}${rule.parent.params}@`
                : "@";
            rule.nodes.forEach((n) => {
                /**
                 * 最理想的 key 是元组，因为我们有多个条件决定
                 * 哪些条件决定唯一的 key，观察一下 tailwind 就知道
                 * prop 和 value 是最明显的
                 * 其次是 scope，也就是 md, lg 或者 dark 这些媒体查询前缀
                 * 然后是伪类和伪元素，可以归类在一起，这里暂时没有实现
                 * 因为 JS 里没有元组，所以简单序列化一下
                 */
                // Scope 在选择器上层 parent 上
                // persude 伪类/伪元素 在选择器上
                // TODO: 分离伪类/伪元素
                // TODO: 对 key 的各个部分进行正规化处理，避免空格带来的影响
                let key = `${scope}${n.prop}:${n.value}${n.important ? "!" : ";"}`;
                getOrDefault(declMap, key).add(n);
            });
        },
        OnceExit(root, helper) {
            // 寻找重复出现次数大于 1 的 decl
            console.log("变换前");
            console.log(root.toString());
            const atom = new Set();
            const touchedRule = new Set();
            const selectorMap = new Map();
            declMap.forEach((declSet) => {
                if (declSet.size > 1) {
                    const decl = declSet.values().next().value;
                    // TODO: 提供 hash 和 tailwind 风格的选择器生成器
                    const selector = "." + decl.prop + "-" + decl.value;
                    const rule = new helper.Rule({
                        selector,
                    });
                    rule.append(new helper.Declaration({
                        prop: decl.prop,
                        value: decl.value,
                    }));
                    atom.add(rule);
                    declSet.forEach((d) => {
                        const rule = d.parent;
                        rule.selectors.forEach((s) => {
                            const map = getOrDefault(selectorMap, s);
                            map.add(s);
                            map.add(selector);
                        });
                        touchedRule.add(rule);
                        d.remove();
                    });
                }
            });
            // rule 中规则被移出，有移空的情况。这时候需要清理
            touchedRule.forEach((r) => {
                if (r.nodes.length === 0) {
                    r.remove();
                }
            });
            atom.forEach((r) => {
                root.append(r);
            });
            console.log("变换后");
            console.log(root.toString());
            console.log("选择器映射关系");
            console.log(selectorMap);
        },
    };
};
plugin.postcss = true;
module.exports = plugin;
