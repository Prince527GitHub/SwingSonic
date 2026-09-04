function buildUrl(base, path, query) {
    const params = new URLSearchParams(query).toString();
    return params ? `${base}${path}?${params}` : `${base}${path}`;
}

function toCamel(text) {
    return text.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

function extract(template) {
    return [...template.matchAll(/<[^>]+>/g)].map(([match]) => match.slice(1, -1).split(":").pop());
}

const SPEC = require("./spec.json");

function resolve(params, method, first = {}, second, third) {
    if (params.length === 0) return method === "GET" || method === "ROUTE" ? { path: {}, query: first, body: undefined } : { path: {}, query: undefined, body: first };

    if (params.length === 1 && typeof first === "string") return {
        path: { [params[0]]: first },
        query: second,
        body: third,
    };

    return {
        path: first,
        query: second,
        body: third,
    };
}

class SwingMusic {
    constructor() {
        this.base = global.config.music.replace(/\/$/, "");
        this.spec = SPEC;

        this._attach();
    }

    _attach() {
        for (const [key, data] of Object.entries(this.spec)) {
            const name = key === "getall" ? "getAll" : toCamel(key);

            this[name] = (auth) => this._buildNamespace(data.prefix, data.routes, auth);
        }
    }

    _buildNamespace(prefix, routes, auth) {
        const object = {};

        for (const route of routes) {
            const params = extract(route.path);

            object[toCamel(route.handler)] = async (first, second, third) => {
                const args = resolve(params, route.method, first, second, third);

                let path = route.path;

                for (const param of params)
                    path = path.replace(new RegExp(`<[^>]*${param}[^>]*>`), encodeURIComponent(args.path[param]));

                return this.request(`${prefix}${path}`, {
                    method: route.method === "ROUTE" ? "GET" : route.method,
                    auth,
                    query: args.query,
                    body: args.body
                });
            };
        }

        object._request = (path, options = {}) => this.request(`${prefix}${path}`, { ...options, auth });

        return object;
    }

    url(path) {
        return `${this.base}${path}`;
    }

    async request(path, { method = "GET", query, body, auth, headers = {}, raw = false } = {}) {
        const url = buildUrl(this.base, path, query);
        const head = { ...headers };

        if (auth) head["Cookie"] = auth;

        if (body !== undefined) {
            head["Content-Type"] = "application/json";
            body = JSON.stringify(body);
        }

        const res = await fetch(url, {
            method,
            headers: head,
            body
        });

        if (raw) return res;

        return res.headers.get("content-type").includes("application/json") ? res.json() : res.text();
    }
}

const api = new SwingMusic();

module.exports = api;
module.exports.create = () => new SwingMusic();
