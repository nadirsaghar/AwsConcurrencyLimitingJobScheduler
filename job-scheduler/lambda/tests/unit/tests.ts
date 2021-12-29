import * as assert from 'assert'
import { lambdaHandler } from "../../src"

describe('my suite', () => {
    it('my test', async () => {
        let request = {
            maxConcurrency: 1,
            jobs: [
                {
                    jobType: 'AppFlow',
                    flowName: "flow1"
                },
                {
                    jobType: 'AppFlow',
                    flowName: "flow2"
                },
                {
                    jobType: 'AppFlow',
                    flowName: "flow3"
                }
            ]

        }
        let response = await lambdaHandler(request, null)
        console.log(JSON.stringify(response,null,4))

        await new Promise( resolve => setTimeout(resolve,20000))
        response = await lambdaHandler(response, null)
        console.log(JSON.stringify(response,null,4))    
        
    }).timeout(30000);
});