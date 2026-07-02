import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

interface CloudVariableUpdate {
  projectId: number;
  variables: { name: string; value: string }[];
  updatedBy?: number;
  timestamp: number;
}

@WebSocketGateway({
  namespace: '/cloud-variables',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
export class CloudVariablesGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(CloudVariablesGateway.name);

  // Track which projects each client is subscribed to
  private readonly clientSubscriptions = new Map<string, Set<number>>();

  afterInit() {
    this.logger.log('Cloud Variables WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.clientSubscriptions.set(client.id, new Set());
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.clientSubscriptions.delete(client.id);
  }

  /**
   * Client subscribes to cloud variable updates for a specific project
   */
  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: number },
  ) {
    const { projectId } = data;
    if (!projectId) return { success: false, error: 'projectId is required' };

    const subs = this.clientSubscriptions.get(client.id);
    if (subs) {
      subs.add(projectId);
    }

    // Join socket.io room for the project
    client.join(`project:${projectId}`);

    this.logger.log(`Client ${client.id} subscribed to project ${projectId}`);
    return { success: true, projectId };
  }

  /**
   * Client unsubscribes from a project's cloud variable updates
   */
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: number },
  ) {
    const { projectId } = data;
    if (!projectId) return { success: false, error: 'projectId is required' };

    const subs = this.clientSubscriptions.get(client.id);
    if (subs) {
      subs.delete(projectId);
    }

    client.leave(`project:${projectId}`);

    this.logger.log(`Client ${client.id} unsubscribed from project ${projectId}`);
    return { success: true, projectId };
  }

  /**
   * Client pushes a cloud variable update
   */
  @SubscribeMessage('updateVariable')
  handleUpdateVariable(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: number; name: string; value: string; userId?: number },
  ) {
    const { projectId, name, value, userId } = data;
    if (!projectId || !name) {
      return { success: false, error: 'projectId and name are required' };
    }

    // Broadcast to all other clients in the project room (excluding sender)
    client.to(`project:${projectId}`).emit('variableChanged', {
      projectId,
      name,
      value,
      updatedBy: userId,
      timestamp: Date.now(),
    });

    return { success: true };
  }

  /**
   * Broadcast cloud variable updates to all clients subscribed to a project.
   * Called externally from ProjectsService when cloud variables are persisted.
   */
  broadcastCloudVariableUpdate(update: CloudVariableUpdate) {
    if (!this.server) {
      this.logger.warn('CloudVariablesGateway server not initialized — skipping broadcast');
      return;
    }
    this.server
      .to(`project:${update.projectId}`)
      .emit('variablesUpdated', update);
  }
}
