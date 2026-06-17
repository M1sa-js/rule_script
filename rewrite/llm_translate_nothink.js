/*
[rewrite_local]
# 拦截 OpenRouter API 并注入禁用思考参数
^https?:\/\/openrouter\.ai\/api\/v1\/chat\/completions url script-request-body https://raw.githubusercontent.com/M1sa-js/rule_script/refs/heads/main/rewrite/llm_translate_nothink.js
[mitm]
hostname = openrouter.ai
*/


let headers = $request.headers;
let ua = headers['User-Agent'] || headers['user-agent'] || '';

if (ua.includes('Easydict') && $request.body) {
    try {
        let body = JSON.parse($request.body);

        body.reasoning = {
            "enabled": false,
            "exclude": true
        };
        body.include_reasoning = false;
        body.reasoning_format = "none";
        
        // 忽略 Cloudflare 和百度的提供商
        body.provider = {
            "ignore": ["cloudflare", "baidu/fp8"]
        };

        $done({ body: JSON.stringify(body) });
    } catch (e) {
        console.log("Easydict JSON 解析异常: " + e);
        $done({}); 
    }
} else {
    $done({});
}