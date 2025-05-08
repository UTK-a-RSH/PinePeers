
import amqp from 'amqplib'; 

export class RabbitMQClient {
  private connection:  any | null = null;
  private channel:  any | null = null; 
  private readonly queueName: string = 'transcode-jobs';
  private readonly url: string = process.env.RABBITMQ_URL || 'amqp://localhost:5672';

  async connect(): Promise<void> {
    try {
      // Establish connection to RabbitMQ
      this.connection = await amqp.connect(this.url); // Remove explicit cast
      if (!this.connection) { // Add null check for type safety and narrowing
        throw new Error("Failed to establish RabbitMQ connection.");
      }
      this.channel = await this.connection.createChannel();

      // Define the queue with properties
      if (!this.channel) { // Add null check for type safety
        throw new Error("Failed to create RabbitMQ channel.");
      }
      if (!this.channel) {
        throw new Error("Failed to create RabbitMQ channel.");
      }
      try {
        await this.channel.checkQueue(this.queueName);
        console.log(`Queue ${this.queueName} exists and is ready for use.`);
      } catch (error) {
        console.error(`Queue ${this.queueName} does not exist:`, error);
        throw new Error(`Queue ${this.queueName} must be created manually before running the application.`);
      }

      console.log(`Connected to RabbitMQ and initialized queue: ${this.queueName}`);
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }


  async publishMessage(message: object): Promise<void> {
    if (!this.channel) throw new Error('RabbitMQ channel not initialized');
    this.channel.sendToQueue(
      this.queueName,
      Buffer.from(JSON.stringify(message)),
      { persistent: true } // Messages survive broker restarts
    );
  }

  getChannel() { // Let TS infer return type
    if (!this.channel) throw new Error('RabbitMQ channel not initialized');
    return this.channel;
  }

  async close(): Promise<void> {
    if (this.channel) await this.channel.close();
    if (this.connection) await this.connection.close();
  }
}

// Singleton instance
export const rabbitMQClient = new RabbitMQClient();
