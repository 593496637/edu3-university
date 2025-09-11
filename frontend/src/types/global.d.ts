// MetaMask provider types
interface RequestArguments {
  method: string;
  params?: unknown[] | Record<string, unknown>;
}

interface ProviderRpcError extends Error {
  message: string;
  code: number;
  data?: unknown;
}

interface ProviderMessage {
  type: string;
  data: unknown;
}

interface ProviderConnectInfo {
  chainId: string;
}

type EventHandler = (data: unknown) => void;
type AccountsChangedHandler = (accounts: string[]) => void;
type ChainChangedHandler = (chainId: string) => void;
type ConnectHandler = (connectInfo: ProviderConnectInfo) => void;
type DisconnectHandler = (error: ProviderRpcError) => void;
type MessageHandler = (message: ProviderMessage) => void;

// 扩展 Window 接口以支持 MetaMask
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      networkVersion?: string;
      selectedAddress?: string;
      chainId?: string;
      request: (args: RequestArguments) => Promise<unknown>;
      on(event: 'accountsChanged', handler: AccountsChangedHandler): void;
      on(event: 'chainChanged', handler: ChainChangedHandler): void;
      on(event: 'connect', handler: ConnectHandler): void;
      on(event: 'disconnect', handler: DisconnectHandler): void;
      on(event: 'message', handler: MessageHandler): void;
      on(event: string, handler: EventHandler): void;
      removeListener(event: 'accountsChanged', handler: AccountsChangedHandler): void;
      removeListener(event: 'chainChanged', handler: ChainChangedHandler): void;
      removeListener(event: 'connect', handler: ConnectHandler): void;
      removeListener(event: 'disconnect', handler: DisconnectHandler): void;
      removeListener(event: 'message', handler: MessageHandler): void;
      removeListener(event: string, handler: EventHandler): void;
      enable?(): Promise<string[]>;
      isConnected?(): boolean;
    };
  }
}

export { };