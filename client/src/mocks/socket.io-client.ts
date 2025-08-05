// Mock socket.io-client for development
export const io = (url: string, options?: any) => {
  return {
    connected: false,
    on: (event: string, callback: Function) => {
      console.log(`Socket mock: listening to ${event}`);
    },
    emit: (event: string, ...args: any[]) => {
      console.log(`Socket mock: emitting ${event}`, args);
    },
    disconnect: () => {
      console.log('Socket mock: disconnected');
    },
    connect: () => {
      console.log('Socket mock: connected');
    },
    off: (event: string) => {
      console.log(`Socket mock: stopped listening to ${event}`);
    }
  };
};

export class Socket {
  connected = false;
}