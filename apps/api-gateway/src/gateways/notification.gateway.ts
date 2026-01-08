import {
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Logger, OnModuleInit } from "@nestjs/common";
import { Server, WebSocket } from "ws";
import { IncomingMessage } from "http";
import { URL } from "url";
import {
  NotificationPubSubService,
  IRealtimeNotification,
} from "@redis/services";

/**
 * WebSocket Gateway for Real-Time Notifications
 *
 * Frontend connects to: ws://localhost:3000/ws/notifications?userId=xxx
 * Receives notifications published via Redis PubSub
 */
@WebSocketGateway({
  path: "/ws/notifications",
})
export class NotificationGateway
  implements
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnModuleInit
{
  private readonly logger = new Logger(NotificationGateway.name);

  // Map: userId → WebSocket[]
  private connectedClients: Map<string, WebSocket[]> = new Map();

  // Map: WebSocket → userId (for cleanup on disconnect)
  private socketToUser: Map<WebSocket, string> = new Map();

  constructor(private readonly notificationPubSub: NotificationPubSubService) {}

  onModuleInit() {
    // Register callback to receive notifications from Redis
    this.notificationPubSub.onNotification((userId, notification) => {
      this.sendToUser(userId, notification);
    });
    this.logger.log(
      "NotificationGateway initialized and listening for Redis messages",
    );
  }

  afterInit(server: Server) {
    this.logger.log("WebSocket server initialized on /ws/notifications");

    // Set up ping interval to detect dead connections
    setInterval(() => {
      this.pingAllClients();
    }, 30000); // Ping every 30 seconds
  }

  handleConnection(client: WebSocket, request: IncomingMessage) {
    try {
      // Parse userId from query string
      const url = new URL(request.url || "", `http://${request.headers.host}`);
      const userId = url.searchParams.get("userId");

      if (!userId) {
        this.logger.warn("WebSocket connection rejected: no userId provided");
        client.close(4001, "userId is required");
        return;
      }

      // Add client to maps
      this.socketToUser.set(client, userId);

      const userSockets = this.connectedClients.get(userId) || [];
      userSockets.push(client);
      this.connectedClients.set(userId, userSockets);

      this.logger.log(
        `Client connected: userId=${userId}, total connections=${userSockets.length}`,
      );

      // Set up pong handler
      client.on("pong", () => {
        // Client is alive
      });

      // Send welcome message
      client.send(
        JSON.stringify({
          type: "connected",
          message: "WebSocket connection established",
          timestamp: new Date().toISOString(),
        }),
      );
    } catch (error) {
      this.logger.error(`Connection handling error: ${error.message}`);
      client.close(4000, "Connection error");
    }
  }

  handleDisconnect(client: WebSocket) {
    const userId = this.socketToUser.get(client);

    if (userId) {
      // Remove from user's socket list
      const userSockets = this.connectedClients.get(userId) || [];
      const filtered = userSockets.filter((ws) => ws !== client);

      if (filtered.length > 0) {
        this.connectedClients.set(userId, filtered);
      } else {
        this.connectedClients.delete(userId);
      }

      this.logger.log(
        `Client disconnected: userId=${userId}, remaining connections=${filtered.length}`,
      );
    }

    this.socketToUser.delete(client);
  }

  /**
   * Send notification to a specific user
   */
  sendToUser(userId: string, notification: IRealtimeNotification): void {
    const sockets = this.connectedClients.get(userId);

    if (!sockets || sockets.length === 0) {
      this.logger.debug(`No active connections for user: ${userId}`);
      return;
    }

    const message = JSON.stringify(notification);
    let sentCount = 0;

    sockets.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
        sentCount++;
      }
    });

    this.logger.log(
      `Sent notification to user ${userId}: ${sentCount} connections`,
    );
  }

  /**
   * Ping all connected clients to detect dead connections
   */
  private pingAllClients(): void {
    this.connectedClients.forEach((sockets, userId) => {
      sockets.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        } else {
          // Remove dead connection
          this.handleDisconnect(ws);
        }
      });
    });
  }

  /**
   * Get connection stats
   */
  getStats(): { totalUsers: number; totalConnections: number } {
    let totalConnections = 0;
    this.connectedClients.forEach((sockets) => {
      totalConnections += sockets.length;
    });

    return {
      totalUsers: this.connectedClients.size,
      totalConnections,
    };
  }
}
