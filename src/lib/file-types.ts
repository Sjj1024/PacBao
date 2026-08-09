export type UploadFileResponse = {
    success: true
    key: string
    url: string
}

export type FileErrorBody = {
    success?: false
    message?: string
}
