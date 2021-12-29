import { AppflowClient, DescribeFlowExecutionRecordsCommand, ExecutionStatus, StartFlowCommand } from "@aws-sdk/client-appflow";
import { Job, JobContext, JobParams, JobStatus } from "./Job";

class AppFlowJobParams implements JobParams {
    jobType: string
    flowName: string
}

class AppFlowJobContext implements JobContext {
    constructor(flowName: string, executionId: string | undefined) {
        this.flowName = flowName
        this.executionId = executionId
        this.jobType = 'AppFlow'
    }

    flowName: string
    executionId: string | undefined
    jobType: string
}

class AppFlowJob implements Job {
    client: AppflowClient
    constructor() {
        this.client = new AppflowClient({ region: "us-east-1" })
    }

    async start(params: AppFlowJobParams): Promise<JobContext> {
        const command = new StartFlowCommand({
            flowName: params.flowName
        })
        console.log(`Kicking off AppFlow [${params.flowName}]`)
        let response = await this.client.send(command)
        let jobContext = new AppFlowJobContext(params.flowName, response.executionId)
        return jobContext
    }

    async getStatus(context: AppFlowJobContext): Promise<string> {
        const command = new DescribeFlowExecutionRecordsCommand({
            flowName: context.flowName,
            maxResults: 1
        })
        console.log(`Getting current status for AppFlow[${context.flowName}]`)
        let status = JobStatus.IN_PROGRESS
        try {
            let response = await this.client.send(command)
            let execution = response.flowExecutions?.[0]
            if ( execution ){
                switch (execution?.executionStatus) {
                    case ExecutionStatus.ERROR:
                        status = JobStatus.FAILED
                        break
                    case ExecutionStatus.SUCCESSFUL:
                        status =  JobStatus.SUCCESS
                        break
                    default:
                        break
                }
            } 
        } catch (error) {
            // in case of an error we assume in progress
            console.error(error)
            return JobStatus.IN_PROGRESS
        }
        return status
    }

}

export {
    AppFlowJob,
    AppFlowJobContext,
    AppFlowJobParams
}