import amqp, { Channel, ConsumeMessage } from 'amqplib';
import { minioClient } from '../config/minio';
import { exec } from 'child_process';
import { promisify } from 'util';
import { rabbitMQClient } from '../config/rabbitmq';


const QUEUE_NAME = rabbitMQClient['queueName'];
const RABBITMQ_URL = rabbitMQClient['url'];
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
  const downloadUrl = event.Records[0].presignedUrl;
  console.log(`Processing upload: ${bucket}/${objectKey}`);

  const videoId = event.Records[0].videoId;
  console.log(`Preparing to process ${bucket}/${objectKey}...`);
  const productionBucket = 'production';
  const transcodedObjectKey = `videos/${videoId}/transcoded.mp4`;
  const uploadUrl = await minioClient.presignedPutObject(productionBucket, transcodedObjectKey, 24 * 60 * 60);


  // Trigger the transcoding container
  await triggerTranscoding(downloadUrl, uploadUrl, videoId);
}

async function triggerTranscoding(downloadUrl: string, uploadUrl: string, videoId: string) {
  const command = `docker run --rm video-container --download-url "${downloadUrl}" --upload-url "${uploadUrl}"`;
  try {
    const { stdout, stderr } = await execPromise(command);
    console.log(`Transcoding container output for video ${videoId}: ${stdout}`);
    if (stderr) console.error(`Transcoding container warnings/errors for video ${videoId}: ${stderr}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error triggering transcoding container for video ${videoId}: ${errorMessage}`);
    throw new Error(`Transcoding failed: ${errorMessage}`);
  }
}

// Start the consumer
startConsumer().catch(console.error);
const execPromise = promisify(exec);
