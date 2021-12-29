import { AppFlowJob } from "./AppFlowJob";
import { Job, JobContext, JobParams, JobStatus } from "./Job";

interface ExecutionContext {
    outstanding: Array<JobParams>
    running: Array<JobContext>
    completed: Array<JobContext>
    failed: Array<JobContext>
}
interface Request {
    maxConcurrency: number
    jobs: Array<JobParams>
    executionContext?: ExecutionContext
}

const handlerOf = (jobType: string): Job => {
    switch (jobType) {
        case "AppFlow": return new AppFlowJob();
        default:
            throw Error('Unknown JobType')
    }
}


export const lambdaHandler = async (event: Request, context: any) => {
    // initialize executionContext if empty
    if (!event.executionContext) {
        event.executionContext = {
            outstanding: [...event.jobs],
            running: [],
            completed: [],
            failed: []
        }
    }

    const { executionContext, maxConcurrency } = event;

    // check status of all running jobs and update ExecutionStatus
    await updateExecutionStatus(executionContext)

    // check if # of the running jobs are less than maxConcurrency
    if (executionContext.running.length < maxConcurrency) {
        let capacity = Math.min(maxConcurrency - executionContext.running.length, executionContext.outstanding.length)
        console.log(`There is room to run ${capacity} new Jobs`)
        let newJobs = executionContext.outstanding.slice(0, capacity)
        executionContext.outstanding = executionContext.outstanding.slice(capacity)
        await Promise.all(newJobs.map(async jobParams => {
            const handler = handlerOf(jobParams.jobType)
            try {
                let jobContext: JobContext = await handler.start(jobParams)
                executionContext?.running.push(jobContext)
            } catch ( error:any ) {     
                console.error(`Unable to start the Job due to ${error.message}`)
                const jobContext = {
                    jobType: jobParams.jobType,
                    comment: 'Unable to start the Job'
                }
                executionContext?.failed.push(jobContext)
            }
        }))
    } else {
        console.log(`There is no room to run any new Jobs. Max Concurrency Limit of ${maxConcurrency} already reached`)
    }

    const response  = { ...event ,
         completed: event.executionContext?.running.length == 0 && event.executionContext?.outstanding.length == 0
        }
    return Promise.resolve(response)

};

const updateExecutionStatus = async (executionContext: ExecutionContext) => {
    const failed: Array<JobContext> = []
    const success: Array<JobContext> = []
    await Promise.all(executionContext.running.map(async jobContext => {
        const handler = handlerOf(jobContext.jobType)
        let status = await handler.getStatus(jobContext)

        switch (status) {
            case JobStatus.FAILED: failed.push(jobContext); break
            case JobStatus.SUCCESS: success.push(jobContext); break
            default:
                break // do nothing if the job is still in progress
        }
    }))

    executionContext.running = executionContext.running.filter(jobContext => ![...failed, ...success].includes(jobContext))
    executionContext.failed = [...executionContext.failed, ...failed]
    executionContext.completed = [...executionContext.completed, ...success]

}
