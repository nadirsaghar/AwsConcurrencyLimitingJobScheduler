
interface JobParams {
    jobType: string
}

interface JobContext {
    jobType: string
}

class JobStatus {
    static IN_PROGRESS:string = "IN_PROGRESS"
    static SUCCESS:string = "SUCCESS"
    static FAILED:string = "FAILED"
}


interface Job {

    start(params: JobParams): Promise<JobContext> 

    getStatus(context: JobContext): Promise<string>

}

export {
    Job,
    JobContext,
    JobStatus,
    JobParams
}