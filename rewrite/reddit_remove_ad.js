/**
 * @name Reddit 去广告 & 解除 NSFW
 * @description 过滤推广, 关 NSFW 提示 (合并版)
 *
 * [rewrite_local]
 * ^https?:\/\/gql(-fed)?\.reddit\.com\/ url script-response-body https://raw.githubusercontent.com/M1sa-js/rule_script/refs/heads/main/rewrite/reddit_remove_ad.js
 *
 * [mitm]
 * hostname = gql.reddit.com, gql-fed.reddit.com
 */

let body = $response.body;

if (body) {
    try {
        let obj = JSON.parse(body);

        // 判断是否为广告节点的纯函数
        function shouldDelete(item) {
            if (item.__typename === "AdPost") return true;
            if (item.node && typeof item.node === 'object') {
                if (item.node.adPayload && typeof item.node.adPayload === 'object') return true;
                if (Array.isArray(item.node.cells)) {
                    if (item.node.cells.some(cell => cell.__typename === "AdMetadataCell" || cell.isAdPost === true)) {
                        return true;
                    }
                }
            }
            return false;
        }

        // 递归遍历并修改数据 (替代 jq 的 walk 函数)
        function walk(node) {
            if (Array.isArray(node)) {
                // 倒序遍历数组以安全地移除元素
                for (let i = node.length - 1; i >= 0; i--) {
                    let item = node[i];
                    if (item && typeof item === 'object') {
                        if (shouldDelete(item)) {
                            node.splice(i, 1);
                        } else {
                            walk(item);
                        }
                    }
                }
            } else if (node && typeof node === 'object') {
                // 修改 NSFW 状态
                if (node.isNsfw === true) node.isNsfw = false;
                if (node.isNsfwMediaBlocked === true) node.isNsfwMediaBlocked = false;
                if (node.isNsfwContentShown === false) node.isNsfwContentShown = true;
                
                // 清理评论区广告
                if (Array.isArray(node.commentsPageAds)) {
                    node.commentsPageAds = [];
                }

                // 递归遍历对象属性
                for (let key in node) {
                    let item = node[key];
                    if (item && typeof item === 'object') {
                        if (shouldDelete(item)) {
                            delete node[key];
                        } else {
                            walk(item);
                        }
                    }
                }
            }
        }

        walk(obj);
        $done({ body: JSON.stringify(obj) });
    } catch (e) {
        // 若解析失败直接返回原数据，避免 App 产生断网错误
        $done({ body: body });
    }
} else {
    $done({});
}
