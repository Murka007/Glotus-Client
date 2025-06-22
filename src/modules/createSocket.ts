import { myClient } from "..";

const toBytes = (b64: string) => {
    return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

type ChallengeData = {
    readonly algorithm: string;
    readonly challenge: string;
    readonly salt: string;
    readonly signature: string;
    readonly maxnumber: number;
    readonly obfuscated?: string;
    readonly key?: string;
};

type WorkerPayload = {
    readonly type: 'work' | 'abort';
    readonly payload?: ChallengeData;
    readonly start?: number;
    readonly max?: number;
};

type WorkerResult = {
    readonly number: number;
    readonly took: number;
    readonly worker?: boolean;
} | null;

class Altcha {
    private code: string | null = null;
    private readonly coreCount = Math.min(16, navigator.hardwareConcurrency || 4);
    private readonly tokenEncode = "IWZ1bmN0aW9uKCl7InVzZSBzdHJpY3QiO2xldCBlPW5ldyBUZXh0RW5jb2Rlcjthc3luYyBmdW5jdGlvbiB0KHQsbixyKXt2YXIgbDtyZXR1cm4gbD1hd2FpdCBjcnlwdG8uc3VidGxlLmRpZ2VzdChyLnRvVXBwZXJDYXNlKCksZS5lbmNvZGUodCtuKSksWy4uLm5ldyBVaW50OEFycmF5KGwpXS5tYXAoZT0+ZS50b1N0cmluZygxNikucGFkU3RhcnQoMiwiMCIpKS5qb2luKCIiKX1mdW5jdGlvbiBuKGUsdD0xMil7bGV0IG49bmV3IFVpbnQ4QXJyYXkodCk7Zm9yKGxldCByPTA7cjx0O3IrKyluW3JdPWUlMjU2LGU9TWF0aC5mbG9vcihlLzI1Nik7cmV0dXJuIG59YXN5bmMgZnVuY3Rpb24gcih0LHI9IiIsbD0xZTYsbz0wKXtsZXQgYT0iQUVTLUdDTSIsYz1uZXcgQWJvcnRDb250cm9sbGVyLGk9RGF0ZS5ub3coKSx1PShhc3luYygpPT57Zm9yKGxldCBlPW87ZTw9bCYmIWMuc2lnbmFsLmFib3J0ZWQmJnMmJnc7ZSsrKXRyeXtsZXQgdD1hd2FpdCBjcnlwdG8uc3VidGxlLmRlY3J5cHQoe25hbWU6YSxpdjpuKGUpfSxzLHcpO2lmKHQpcmV0dXJue2NsZWFyVGV4dDpuZXcgVGV4dERlY29kZXIoKS5kZWNvZGUodCksdG9vazpEYXRlLm5vdygpLWl9fWNhdGNoe31yZXR1cm4gbnVsbH0pKCkscz1udWxsLHc9bnVsbDt0cnl7dz1mdW5jdGlvbiBlKHQpe2xldCBuPWF0b2IodCkscj1uZXcgVWludDhBcnJheShuLmxlbmd0aCk7Zm9yKGxldCBsPTA7bDxuLmxlbmd0aDtsKyspcltsXT1uLmNoYXJDb2RlQXQobCk7cmV0dXJuIHJ9KHQpO2xldCBmPWF3YWl0IGNyeXB0by5zdWJ0bGUuZGlnZXN0KCJTSEEtMjU2IixlLmVuY29kZShyKSk7cz1hd2FpdCBjcnlwdG8uc3VidGxlLmltcG9ydEtleSgicmF3IixmLGEsITEsWyJkZWNyeXB0Il0pfWNhdGNoe3JldHVybntwcm9taXNlOlByb21pc2UucmVqZWN0KCksY29udHJvbGxlcjpjfX1yZXR1cm57cHJvbWlzZTp1LGNvbnRyb2xsZXI6Y319bGV0IGw7b25tZXNzYWdlPWFzeW5jIGU9PntsZXR7dHlwZTpuLHBheWxvYWQ6byxzdGFydDphLG1heDpjfT1lLmRhdGEsaT1udWxsO2lmKCJhYm9ydCI9PT1uKWwmJmwuYWJvcnQoKSxsPXZvaWQgMDtlbHNlIGlmKCJ3b3JrIj09PW4pe2lmKCJvYmZ1c2NhdGVkImluIG8pe2xldHtrZXk6dSxvYmZ1c2NhdGVkOnN9PW98fHt9O2k9YXdhaXQgcihzLHUsYyxhKX1lbHNle2xldHthbGdvcml0aG06dyxjaGFsbGVuZ2U6ZixzYWx0OmR9PW98fHt9O2k9ZnVuY3Rpb24gZShuLHIsbD0iU0hBLTI1NiIsbz0xZTYsYT0wKXtsZXQgYz1uZXcgQWJvcnRDb250cm9sbGVyLGk9RGF0ZS5ub3coKSx1PShhc3luYygpPT57Zm9yKGxldCBlPWE7ZTw9byYmIWMuc2lnbmFsLmFib3J0ZWQ7ZSsrKXtsZXQgdT1hd2FpdCB0KHIsZSxsKTtpZih1PT09bilyZXR1cm57bnVtYmVyOmUsdG9vazpEYXRlLm5vdygpLWl9fXJldHVybiBudWxsfSkoKTtyZXR1cm57cHJvbWlzZTp1LGNvbnRyb2xsZXI6Y319KGYsZCx3LGMsYSl9bD1pLmNvbnRyb2xsZXIsaS5wcm9taXNlLnRoZW4oZT0+e3NlbGYucG9zdE1lc3NhZ2UoZSYmey4uLmUsd29ya2VyOiEwfSl9KX19fSgpOw==";
    private readonly workerBlob = new Blob([toBytes(this.tokenEncode)], { type: "text/javascript;charset=utf-8" });

    static createPayload(data: ChallengeData, result: { number: number; took: number }): string {
        return btoa(JSON.stringify({
            algorithm: data.algorithm,
            challenge: data.challenge,
            number: result.number,
            salt: data.salt,
            signature: data.signature,
            test: !!data || undefined,
            took: result.took
        }));
    }

    private createWorker(name = "alt_worker"): Worker {
        try {
            const url = URL.createObjectURL(this.workerBlob);
            const worker = new Worker(url, { name });

            worker.addEventListener("error", () => URL.revokeObjectURL(url));
            return worker;
        } catch (e) {
            return new Worker(`data:text/javascript;base64,${this.tokenEncode}`, { name });
        }
    }

    private async fetchChallenge(): Promise<ChallengeData> {
        const res = await fetch("https://api.moomoo.io/verify");
        if (!res.ok) throw new Error("Failed to fetch challenge.");
        return res.json();
    }

    private async getWorkerSolution(
        task: ChallengeData,
        total: number,
        count = this.coreCount
    ): Promise<WorkerResult> {
        const workerCount = Math.min(16, Math.max(1, count));
        const workers: Worker[] = Array.from({ length: workerCount }, () => this.createWorker());
        const chunkSize = Math.ceil(total / workerCount);

        const results = await Promise.all(
            workers.map((worker, index) => {
                const start = index * chunkSize;

                return new Promise<WorkerResult>(resolve => {
                    worker.onmessage = (msg: MessageEvent<WorkerResult>) => {
                        if (msg.data) {
                            workers.forEach(w => {
                                if (w !== worker) w.postMessage({ type: "abort" });
                            });
                        }
                        resolve(msg.data ?? null);
                    };

                    worker.onerror = () => resolve(null);

                    const message: WorkerPayload = {
                        type: "work",
                        payload: task,
                        start,
                        max: start + chunkSize
                    };

                    worker.postMessage(message);
                });
            })
        );

        workers.forEach(worker => worker.terminate());

        return results.find(r => !!r) ?? null;
    }

    private async validateChallenge(data: ChallengeData): Promise<{ challengeData: ChallengeData; solution: WorkerResult }> {
        const solution = await this.getWorkerSolution(data, data.maxnumber);
        if (!solution) throw new Error("Failed to solve challenge.");
        return { challengeData: data, solution };
    }

    async generate(): Promise<string> {
        try {
            const challengeData = await this.fetchChallenge();
            const { solution } = await this.validateChallenge(challengeData);
            const encoded = Altcha.createPayload(challengeData, solution as NonNullable<WorkerResult>);
            this.code = `alt:${encoded}`;
            return encodeURIComponent(this.code);
        } catch (error) {
            console.error("Token generation failed:", error);
            throw error;
        }
    }
}

const altcha = new Altcha();
const createSocket = async () => {
    const token = await altcha.generate();
    const socket = myClient.connection.socket!;
    const origin = new URL(socket.url).origin;
    const url = origin + "/?token=" + token;
    const ws = new WebSocket(url);
    ws.binaryType = "arraybuffer";
    return ws;
}

export default createSocket;