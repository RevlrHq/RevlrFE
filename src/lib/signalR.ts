import * as signalR from '@microsoft/signalr';
import { create } from 'zustand';

interface SignalRStore {
    connection: signalR.HubConnection | null;
    isConnected: boolean;
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    sendMessage: (method: string, ...args: unknown[]) => Promise<void>;
}

export const useSignalRStore = create<SignalRStore>((set, get) => ({
    connection: null,
    isConnected: false,

    connect: async () => {
        const connection = new signalR.HubConnectionBuilder()
            .withUrl(process.env.NEXT_PUBLIC_SIGNALR_HUB_URL!)
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Information)
            .build();

        // Set up handlers
        connection.on('BalanceUpdate', () => {
            //   useFinanceStore.getState().updateBalance(amount);
        });

        connection.on('NewTransaction', () => {
            //   useFinanceStore.getState().addTransaction(transaction);
        });

        try {
            await connection.start();
            set({ connection, isConnected: true });
        } catch (err) {
            console.error('SignalR Connection Error:', err);
        }
    },

    disconnect: async () => {
        await get().connection?.stop();
        set({ connection: null, isConnected: false });
    },

    sendMessage: async (method, ...args) => {
        await get().connection?.invoke(method, ...args);
    },
}));
