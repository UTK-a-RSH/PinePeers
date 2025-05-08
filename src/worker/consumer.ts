import amqp, { Channel, Connection, ConsumeMessage } from 'amqplib';

// Configuration
const QUEUE_NAME = 'transcode-jobs';
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const PROCESSING_TIMEOUT = 30000; 

async function startConsumer() {
  try {
    
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel: Channel = await connection.createChannel();

    
    await channel.assertQueue(QUEUE_NAME, { durable: true });

    // Limit to one message at a time
    await channel.prefetch(1);

    console.log(`Waiting for messages in ${QUEUE_NAME}. To exit press CTRL+C`);

    // Start consuming messages
    channel.consume(QUEUE_NAME, async (msg: ConsumeMessage | null) => {
      if (!msg) return; 

      console.log(`Received message: ${msg.content.toString()}`);

      // Set a 30-second timeout
      const timeout = setTimeout(() => {
        console.error(`Processing timed out for message`);
        channel.nack(msg, false, false); // Discard the message
      }, PROCESSING_TIMEOUT);

      try {
        // Process the message
        await processMessage(msg.content.toString());
        clearTimeout(timeout); // Clear timeout if successful

        // Acknowledge the message to delete it from the queue
        channel.ack(msg);
        console.log(`Message acknowledged and deleted from queue.`);
      } catch (error) {
        clearTimeout(timeout); // Clear timeout on error
        console.error(`Error processing message:`, error);

        // Requeue the message for retry
        channel.nack(msg, false, true);
      }
    }, { noAck: false }); // Require manual acknowledgment

  } catch (error) {
    console.error('Error starting consumer:', error);
  }
}

async function processMessage(messageContent: string) {
  // Parse the message content
  const event = JSON.parse(messageContent);

  // Validate the event
  if (event.EventName !== 's3:ObjectCreated:Put') {
    console.log(`Invalid event type, skipping...`);
    return;
  }

  // Extract bucket and object key from the event body
  const bucket = event.Records[0].s3.bucket.name;
  const objectKey = event.Records[0].s3.object.key;
  console.log(`Processing upload: ${bucket}/${objectKey}`);

  
  console.log(`Preparing to process ${bucket}/${objectKey}...`);
}

// Start the consumer
startConsumer().catch(console.error);