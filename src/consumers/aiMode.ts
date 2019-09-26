import {ElasticsearchService} from '../connectors/elasticsearch.service';
import * as rs from 'request-promise';
import {APConstants} from '../config/settings';
import * as Builder from 'elastic-builder';
import {listServices} from'../services/listServices';
import {notificationController} from '../controllers/notifications';
const productListIndex = APConstants.indexes.productlist.index;
const productListType = APConstants.indexes.productlist.type;

export class aiConsumer {
    private static TGEs = ElasticsearchService.TGEs;
    private static clientEs   = ElasticsearchService.clientEs;

    public static async generateAIInsights(message, content) {
        console.log('INSIDE THE AI CONSUMER', content);
        message.ack(true);
        content = JSON.parse(content);
        const url = content.S3_FILE_PATHS;
        const response = await rs(url);
        console.log('RESPONSE ==============', response);
        let Params : any = {}
            let BuilderQuery = Builder.requestBodySearch()
            Params.query = BuilderQuery.query(Builder.boolQuery().must(Builder.existsQuery('productLookAlike')).must(Builder.termsQuery('msisdn', JSON.parse(response)))).agg(Builder.avgAggregation('avg_lookalikescore', `productLookAlike.${content.PRODUCT_TYPE}`));
        //get average score of all the msisdns uploaded against the product type passed
        let average_score =  ES_response.aggregations.avg_lookalikescore.value;
        let min_score = average_score - 0.1000000000000000;
        let max_score = average_score + 0.1000000000000000;
        //range to query by and pass to insights service
        const criteria = {
            minscore : min_score,
            maxscore: max_score,
            product_type: content.PRODUCT_TYPE,
            limit: content.LIMIT / 5 ,
        };
        const demographicInsights = await insightService.getDemographyInsights(this.TGEs, criteria, false, false, content.MODE);
        const behavioralInsights = await insightService.getBehaviouralInsights(this.TGEs, criteria, false, false, content.MODE);
        const interestsInsights = await insightService.getInterestInsights(this.TGEs, criteria, false, false, content.MODE);
        const insights: any = {};
            insights.insights = {
                behavioralInsights,
                demographicInsights,
                interestsInsights,
            };
            insights.mode = content.MODE;
            insights.id = content.FILE_ID;
        // WRITE IT INTO INSIGHTS DB
            try{
                let response = listServices.indexToES(insightsIndex, insightsType, insights, content.FILE_ID)
                if (response) {
                    const mailSubject = 'AI Assitive Mode Insight Generation Complete';
                    const mailMessage = `Insight generation for similar products to your uploaded product <b>${content.FILE_ID}</b> has been generated successfully,
                                        please sign in to your account to view insights `;
                    // IN APP NOTIFICATION
                    notificationController.createNotification(content.CREATED_BY, {
                        type        : 'notification',
                        subType     : 'AiAssistiveInsights',
                        url         : '',
                        segment     : content.FILE_ID,
                        generated   : new Date().getTime(),
                    });
                    // update product list ES
                    let body = {doc: {status : 'completed', no_of_profiles : demographicInsights.total }}
                    await listServices.updateES(productListIndex, productListType, body, content.FILE_ID)
                    await MailService.sendInsightsGenerationMail(content.CREATED_BY, mailSubject, mailMessage);
                    console.log('AI ASSISTIVE SUCCESSFULLY DONE!!!!!!!!!!!!!!');   
                }
            }
            catch {
                console.log("An error occured while sending email")
            }
    }
}