import axios, { AxiosInstance, AxiosError } from 'axios';

interface SophiaConfig {
  authUrl: string;
  clientId: string;
  graphqlUrl: string;
  organizationId: string;
  username: string;
  password: string;
}

interface GraphQLError {
  message: string;
  extensions?: {
    errors?: Array<{ debug_message?: string }>;
  };
}

const defaultConfig: Omit<SophiaConfig, 'username' | 'password'> = {
  authUrl: 'https://authcloudservice.com/auth/realms/foundation-eu-west-1-production/protocol/openid-connect/token',
  clientId: 'sophia-frontend',
  graphqlUrl: process.env.SOPHIA_GRAPHQL_URL || 'https://sophia3.sewan.fr/go/api/graphql/',
  organizationId: process.env.SOPHIA_ORGANIZATION_ID || '8f19e50e-1be4-48b7-8c2a-6d0c477ff141',
};

const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 1000;

function isRetryable(err: unknown): boolean {
  if (err instanceof AxiosError) {
    if (!err.response) return true; // network error / timeout
    const status = err.response.status;
    return status >= 500 || status === 429;
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class SophiaClient {
  private config: SophiaConfig;
  private axiosInstance: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: SophiaConfig) {
    this.config = config;
    this.axiosInstance = axios.create({ timeout: 30000 });
  }

  private async authenticate(): Promise<boolean> {
    try {
      const authData = new URLSearchParams({
        grant_type: 'password',
        client_id: this.config.clientId,
        username: this.config.username,
        password: this.config.password,
      });

      const response = await this.axiosInstance.post(this.config.authUrl, authData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      if (response.status === 200 && response.data.access_token) {
        this.accessToken = response.data.access_token;
        this.tokenExpiry = Date.now() + response.data.expires_in * 1000 - 60000;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Sophia auth error:', error instanceof Error ? error.message : error);
      return false;
    }
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.accessToken || Date.now() >= this.tokenExpiry) {
      const ok = await this.authenticate();
      if (!ok) throw new Error('Sophia authentication failed');
    }
  }

  async executeGraphQL<T = unknown>(query: string, variables?: Record<string, unknown>): Promise<T> {
    await this.ensureAuthenticated();

    let lastError: unknown;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await this.axiosInstance.post(
          this.config.graphqlUrl,
          { query, variables: variables || {} },
          {
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
              'X-Organization-Id': this.config.organizationId,
            },
          }
        );

        if (response.data.errors) {
          const firstErr = response.data.errors[0] as GraphQLError;
          const debugMsgs = firstErr?.extensions?.errors
            ?.map(e => e.debug_message)
            .filter(Boolean);
          const detail = debugMsgs?.length ? ` (${debugMsgs.join('; ')})` : '';
          throw new Error(`GraphQL: ${firstErr?.message || 'Unknown error'}${detail}`);
        }

        return response.data.data as T;
      } catch (err: unknown) {
        lastError = err;

        if (attempt < MAX_RETRIES && isRetryable(err)) {
          console.warn(`Sophia retry ${attempt + 1}/${MAX_RETRIES} après erreur réseau`);
          await sleep(RETRY_DELAY_MS * (attempt + 1));
          continue;
        }

        if (err instanceof AxiosError && err.response?.status) {
          throw new Error(`Sophia erreur ${err.response.status}`);
        }
        throw err;
      }
    }

    throw lastError;
  }

  async testConnection(): Promise<boolean> {
    try {
      const result = await this.executeGraphQL<{ organization?: { getOrganization?: { id: string } } }>(
        `query TestConnection($id: ID!) {
          organization { getOrganization(id: $id) { id name } }
        }`,
        { id: this.config.organizationId }
      );
      return !!(result?.organization?.getOrganization?.id);
    } catch {
      return false;
    }
  }
}

const globalForSophia = globalThis as unknown as { sophiaClient: SophiaClient | undefined };

export function getSophiaClient(): SophiaClient {
  if (!globalForSophia.sophiaClient) {
    const username = process.env.SOPHIA_USERNAME;
    const password = process.env.SOPHIA_PASSWORD;
    if (!username || !password) {
      throw new Error('SOPHIA_USERNAME and SOPHIA_PASSWORD must be set');
    }
    globalForSophia.sophiaClient = new SophiaClient({
      ...defaultConfig,
      username,
      password,
    });
  }
  return globalForSophia.sophiaClient;
}
