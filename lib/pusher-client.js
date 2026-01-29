'use client';

import PusherClient from 'pusher-js';

let pusherClientInstance = null;

export const getPusherClient = () => {
    if (!pusherClientInstance && typeof window !== 'undefined') {
        pusherClientInstance = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY, {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
        });
    }
    return pusherClientInstance;
};
