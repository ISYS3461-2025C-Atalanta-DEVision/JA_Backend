import {
  Injectable,
  Inject,
  OnModuleInit,
  UnauthorizedException,
} from "@nestjs/common";
import * as admin from "firebase-admin";
import { FIREBASE_OPTIONS } from "./firebase.constants";
import { FirebaseModuleOptions, FirebaseUser } from "./interfaces";

@Injectable()
export class FirebaseService implements OnModuleInit {
  private app: admin.app.App;
  private initialized = false;

  constructor(
    @Inject(FIREBASE_OPTIONS)
    private readonly options: FirebaseModuleOptions,
  ) {}

  onModuleInit() {
    this.initializeApp();
  }

  private initializeApp() {
    if (this.initialized) return;

    // Check if Firebase credentials are provided
    if (
      !this.options.projectId ||
      !this.options.clientEmail ||
      !this.options.privateKey
    ) {
      console.warn(
        "Firebase credentials not configured. Firebase auth will not work.",
      );
      return;
    }

    try {
      if (!admin.apps.length) {
        this.app = admin.initializeApp({
          credential: admin.credential.cert({
            projectId: this.options.projectId,
            clientEmail: this.options.clientEmail,
            privateKey: this.options.privateKey.replace(/\\n/g, "\n"),
          }),
        });
      } else {
        this.app = admin.app();
      }
      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize Firebase:", error.message);
    }
  }

  /**
   * Verify Firebase ID token and extract user info
   */
  async verifyIdToken(idToken: string): Promise<FirebaseUser> {
    if (!this.initialized || !this.app) {
      throw new UnauthorizedException("Firebase is not configured");
    }

    try {
      const decodedToken = await this.app.auth().verifyIdToken(idToken);

      return {
        uid: decodedToken.uid,
        email: decodedToken.email || "",
        name: decodedToken.name || decodedToken.email?.split("@")[0] || "User",
        picture: decodedToken.picture,
        emailVerified: decodedToken.email_verified || false,
      };
    } catch (error) {
      if (error.code === "auth/id-token-expired") {
        throw new UnauthorizedException("Firebase token expired");
      }
      if (error.code === "auth/id-token-revoked") {
        throw new UnauthorizedException("Firebase token revoked");
      }
      if (error.code === "auth/argument-error") {
        throw new UnauthorizedException("Invalid Firebase token");
      }
      throw new UnauthorizedException("Firebase authentication failed");
    }
  }

  /**
   * Get user by Firebase UID
   */
  async getUser(uid: string): Promise<admin.auth.UserRecord | null> {
    if (!this.initialized || !this.app) {
      return null;
    }

    try {
      return await this.app.auth().getUser(uid);
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if Firebase is properly configured
   */
  isConfigured(): boolean {
    return this.initialized;
  }
}
