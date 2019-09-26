import * as Amqp from 'amqp-ts';
import {APConstants} from '../config/settings';
import {aiConsumer} from '../consumers/aiMode';
export class MQProcessor {


    //queue and exchange definitions for AI Service
    public static AiServiceExchange: Amqp.Exchange;
    public static AiServiceQueue: Amqp.Queue;

    //connection settings for local rabbit mq
    public static localConnection: any = new Amqp.Connection(APConstants.localQueue);

     // this is the static function that is invoked on server start up and it is used to establish all the connections to various queues.
    public static createConnections() {
        console.log('Creating MQ connections');
        try {

            this.AiServiceExchange = this.localConnection.declareExchange(this.aiServiceQueueName, 'direct', {durable: true});
            this.AiServiceQueue = this.localConnection.declareQueue(this.aiServiceQueueName);
            this.AiServiceQueue.bind(this.AiServiceExchange);
            this.AiServiceQueue.prefetch(1);
            this.AiServiceQueue.activateConsumer((message) => {
                console.log(`LISTENING ON ${APConstants.aiServiceQueue} `);
                aiConsumer.generateAIInsights(message, message.getContent());
            });
        }
        catch (e) {
            console.log(e);
        }
    }

}