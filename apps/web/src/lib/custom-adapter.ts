import { prisma } from '@/lib/prisma';
import { IntegrationProvider } from '@prisma/client';
import { Adapter } from 'next-auth/adapters';

function mapProviderToEnum(provider: string): IntegrationProvider | null {
  const p = provider.toUpperCase();
  if (p === 'GITHUB') return IntegrationProvider.GITHUB;
  if (p === 'JIRA') return IntegrationProvider.JIRA;
  if (p === 'ATLASSIAN') return IntegrationProvider.ATLASSIAN;
  return null;
}

export function CustomAdapter(): Adapter {
  return {
    async createUser(user) {
      const { email, name, image } = user;
      const created = await prisma.user.create({
        data: {
          email,
          full_name: name,
          avatar_url: image, // Map image -> avatar_url
          role: 'STUDENT', // Default role
        },
      });
      return {
        id: created.id,
        email: created.email,
        emailVerified: null,
        name: created.full_name,
        image: created.avatar_url,
      };
    },
    async getUser(id) {
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) return null;
      return {
        id: user.id,
        email: user.email,
        emailVerified: null, // Backend doesn't seem to have this
        name: user.full_name,
        image: user.avatar_url,
      };
    },
    async getUserByEmail(email) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return null;
      return {
        id: user.id,
        email: user.email,
        emailVerified: null,
        name: user.full_name,
        image: user.avatar_url,
      };
    },
    async getUserByAccount({ providerAccountId, provider }) {
      const providerEnum = mapProviderToEnum(provider);
      if (!providerEnum) return null;

      const token = await prisma.integrationToken.findUnique({
        where: {
          provider_provider_user_id: {
            provider: providerEnum,
            provider_user_id: providerAccountId,
          },
        },
        include: { user: true },
      });

      if (!token?.user) return null;

      return {
        id: token.user.id,
        email: token.user.email,
        emailVerified: null,
        name: token.user.full_name,
        image: token.user.avatar_url,
      };
    },
    async updateUser(user) {
      const { id, name, image, email } = user;
      const updated = await prisma.user.update({
        where: { id },
        data: {
          full_name: name,
          avatar_url: image,
          email: email,
        },
      });
      return {
        id: updated.id,
        email: updated.email,
        emailVerified: null,
        name: updated.full_name,
        image: updated.avatar_url,
      };
    },
    async linkAccount(account) {
      const providerEnum = mapProviderToEnum(account.provider);
      if (!providerEnum)
        throw new Error(`Unsupported provider: ${account.provider}`);

      await prisma.integrationToken.create({
        data: {
          user_id: account.userId,
          provider: providerEnum,
          provider_user_id: account.providerAccountId, // Map providerAccountId -> provider_user_id

          access_token: account.access_token,
          refresh_token: account.refresh_token,
          expires_at: account.expires_at ? BigInt(account.expires_at) : null,
          token_type: account.token_type,
          scope: account.scope,
          id_token: account.id_token,
          session_state: account.session_state as string,
        },
      });
      // Adapter expects Account or void. We return simple Account object
      return account as any;
    },
    async createSession(session) {
      // If we use database sessions. But we likely use JWT.
      // Implementing just in case, but BE schema didn't mention Session table.
      // So checking schema... no Session table.
      // We will skip session methods and enforce strategy: 'jwt' in config.
      return session;
    },
    async getSessionAndUser(sessionToken) {
      return null;
    },
    async updateSession(session) {
      return null;
    },
    async deleteSession(sessionToken) {
      return null;
    },
    async unlinkAccount({ providerAccountId, provider }) {
      const providerEnum = mapProviderToEnum(provider);
      if (!providerEnum) return;

      await prisma.integrationToken.delete({
        where: {
          provider_provider_user_id: {
            provider: providerEnum,
            provider_user_id: providerAccountId,
          },
        },
      });
    },
  };
}
