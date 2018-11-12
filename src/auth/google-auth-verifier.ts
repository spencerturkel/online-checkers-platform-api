import { OAuth2Client } from 'google-auth-library';
import { TokenPayload } from 'google-auth-library/build/src/auth/loginticket';

/**
 * Verifies Google OAuth2 tokens.
 */
export class GoogleAuthVerifier {
  private readonly oauthClient: OAuth2Client;

  constructor(private readonly clientId: string) {
    this.oauthClient = new OAuth2Client(clientId);
  }

  async verify(idToken: string): Promise<TokenPayload | null> {
    let result;
    try {
      result = await this.oauthClient.verifyIdToken({
        audience: this.clientId,
        idToken,
      });
    } catch (e) {
      return null;
    }

    if (result == null) {
      console.log('verify failed');
      return null;
    }

    const payload = result.getPayload();

    if (!payload) {
      console.log('payload failed');
      return null;
    }

    return payload;
  }
}
