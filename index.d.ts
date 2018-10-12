declare module 'tcp-port-used'

// Type definitions for React (react-dom) 16.0
// Project: https://github.com/stdarg/tcp-port-used
// Definitions by: Gaute Johansen <https://github.com/gautejohan>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 3.1.2

export as namespace TcpPortUsed;

export declare function check(port: number | any, host: string): Promise<boolean>;

export function waitForStatus(port: number | any, host: string, inUse: boolean, retryTimeMs: number, timeOutMs: number): Promise<void>;

export function waitUntilFree(port: any, retryTimeMs: any, timeOutMs: any): Promise<void>;

export function waitUntilFreeOnHost(port: number | any, host: string, retryTimeMs: number, timeOutMs: number): Promise<void>;

export function waitUntilUsed(port: number | any, retryTimeMs: number, timeOutMs: number): Promise<void>;

export function waitUntilUsedOnHost(port: number | any, host: string, retryTimeMs: number, timeOutMs: number): Promise<void>;

export namespace check {
    const prototype: {
    };

}

export namespace waitForStatus {
    const prototype: {
    };

}

export namespace waitUntilFree {
    const prototype: {
    };

}

export namespace waitUntilFreeOnHost {
    const prototype: {
    };

}

export namespace waitUntilUsed {
    const prototype: {
    };

}

export namespace waitUntilUsedOnHost {
    const prototype: {
    };

}
