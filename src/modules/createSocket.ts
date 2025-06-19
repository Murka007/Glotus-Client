import { myClient } from "..";

const getToken = () => {
    // return new Promise<string>((resolve, reject) => {
    //     window.grecaptcha.ready(() => {
    //         window.grecaptcha.execute(
    //             "6LfahtgjAAAAAF8SkpjyeYMcxMdxIaQeh-VoPATP",
    //             { action: "homepage" }
    //         ).then(resolve).catch(reject);
    //     })
    // })
}

const createSocket = async () => {
    // const token = await getToken();
    const socket = myClient.connection.socket!;
    // const url = socket.url.match(/^(ws.+?token=)/)![1] + encodeURIComponent("re:" + token);
    const url = socket.url;
    const ws = new WebSocket(url);
    ws.binaryType = "arraybuffer";
    return ws;
}

export default createSocket;