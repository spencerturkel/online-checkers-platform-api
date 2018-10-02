import { OAuth2Client } from 'google-auth-library';

export class GoogleAuthVerifier {
  private readonly oauthClient: OAuth2Client;
  constructor(private readonly clientId: string) {
    this.oauthClient = new OAuth2Client(clientId);
  }
  async verify(idToken: string): Promise<string | null> {
    const result = await this.oauthClient.verifyIdToken({
      audience: this.clientId,
      idToken,
    });

    if (result == null) {
      console.log('verify failed');
      return null;
    }

    const payload = result.getPayload();

    if (!payload) {
      console.log('payload failed');
      return null;
    }

    return payload.sub;
  }
}
