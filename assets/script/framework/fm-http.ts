import { FMLog } from "./fm-log";

/**
 * [M] 网络连接
 * - [用法] 这里只是给出了一个样例,实际使用中http请求需要更加定制化
 * - [注意] 考虑await无法对reject()进行处理,需要进行try-catch封装,并在catch中返回null
 * - [注意] 需要处理浏览器跨域请求;如果是cros方案,需要后端(目标url)进行配合才可以实现
 * - [注意] GET方法不允许包含body,只允许包含query
 * - [注意] body的类型建议前后端使用interface进行约束
 */
export class FMHttp {

    /**
     * fetch+get+json
     * @param url 
     */
    static async fetch_get_json(url: string): Promise<object> {
        try {
            let response = await fetch(url, {
                method: "GET",
                mode: "cors",
                headers: new Headers({ "Content-Type": "application/json" }),
            })
            let json = await response.json()
            return json
        } catch (error) {
            FMLog.error(error)
            return null
        }
    }

    /**
     * fetch+post+json
     * @param url 
     * @param body
     */
    static async fetch_post_json(url: string, body: object): Promise<object> {
        try {
            let response = await fetch(url, {
                method: "POST",
                mode: "cors",
                headers: new Headers({ "Content-Type": "application/json" }),
                body: JSON.stringify(body)
            })
            let json = await response.json()
            return json
        } catch (error) {
            FMLog.error(error)
            return null
        }
    }

    /**
     * XMLHttpRequest+get+json
     * @param url 
     */
    static xhr_get_json(url: string): Promise<object> {
        return new Promise(res => {
            try {
                let xhr = new XMLHttpRequest()
                xhr.responseType = "json"
                xhr.open("GET", url, true)
                xhr.setRequestHeader("Content-Type", "application/json")
                xhr.onerror = () => { throw new Error("xhr-on-error") }
                xhr.ontimeout = () => { throw new Error("xhr-on-timeout") }
                xhr.onreadystatechange = () => {
                    if (xhr.readyState != 4) { return }
                    if (xhr.status >= 200 && xhr.status < 400) {
                        res(xhr.response)
                    } else {
                        throw new Error("xhr-status-not-200-400")
                    }
                }
                xhr.send()
            } catch (error) {
                FMLog.error(error)
                res(null)
            }
        })
    }

    /**
     * XMLHttpRequest+post+json
     * @param url 
     * @param body 
     */
    static async xhr_post_json(url: string, body: object): Promise<object> {
        return new Promise(res => {
            try {
                let xhr = new XMLHttpRequest()
                xhr.responseType = "json"
                xhr.open("POST", url, true)
                xhr.setRequestHeader("Content-Type", "application/json")
                xhr.onerror = () => { throw new Error("xhr-on-error") }
                xhr.ontimeout = () => { throw new Error("xhr-on-timeout") }
                xhr.onreadystatechange = () => {
                    if (xhr.readyState != 4) { return }
                    if (xhr.status >= 200 && xhr.status < 400) {
                        res(xhr.response)
                    } else {
                        throw new Error("xhr-status-not-200-400")
                    }
                }
                xhr.send(JSON.stringify(body))
            } catch (error) {
                FMLog.error(error)
                res(null)
            }
        })
    }

}